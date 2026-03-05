import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
    triggerVeoVideo,
    checkVeoVideo,
    downloadVeoVideo,
} from '@/lib/aiVideoService';
import { uploadVideoToCloudinary } from '@/lib/cloudinaryUtils';

// Vercel Pro 타임아웃 확장 (초 단위)
export const maxDuration = 60;

// Netlify / Vercel Serverless 타임아웃 호환 Polling API
// 한 번의 호출에 1개 상품만 처리하여 타임아웃 방지
// 워크플로우: pending → generating → completed / failed
export async function GET(request: NextRequest) {
    // 내부 호출 전용 보호: CRON_SECRET 헤더 검증
    // 새로운 상품 등록 POST API에서 fetch할 때 동일한 시크랫 포함
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('x-cron-secret');
        if (authHeader !== cronSecret) {
            // 내부 IP에서의 호출은 대부분 헤더없이 오지만, 시크릿 설정된 경우에만 검증
            const referer = request.headers.get('referer') || '';
            const host = request.headers.get('host') || '';
            const isInternalCall = referer.includes(host);
            if (!isInternalCall) {
                console.warn('[Sync Worker] 예외 호출 차단');
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }
    }

    try {
        const pendingProducts = await productStore.getPendingVideoProducts(1);

        let processed = 0;

        for (const product of pendingProducts) {
            console.log(`[Sync Worker] 상품 ${product.id} 상태 처리: ${product.videoStatus}`);

            try {
                const mediaType = product.mediaGenerationType || 'video';

                // ─────────────────────────────────────────────
                // 1. pending 상태: 영상 생성 트리거 혹은 이미지 생성
                // ─────────────────────────────────────────────
                if (product.videoStatus === 'pending') {
                    if (mediaType === 'image') {
                        console.log(`[Sync Worker] AI 이미지 가상 피팅 생성 시작: ${product.id}`);

                        try {
                            const { generateTryOnImage } = await import('@/lib/aiImageService');
                            const { uploadImageToCloudinary } = await import('@/lib/cloudinaryUtils');

                            const targetGender = product.gender === 'unisex' ? (Math.random() < 0.75 ? 'female' : 'male') : product.gender;

                            await productStore.updateVideoStatus(product.id, 'generating', undefined, undefined, undefined, 'image-generation', undefined, supabaseAdmin);

                            const aiResult = await generateTryOnImage(
                                { name: product.name, fabric: product.fabric, gender: targetGender, category: product.category },
                                product.imageUrl
                            );

                            if (aiResult.success && aiResult.imageBuffer) {
                                console.log(`[Sync Worker] AI 이미지 완료, Cloudinary 업로드 시작`);
                                const cloudinaryUrl = await uploadImageToCloudinary(aiResult.imageBuffer, product.id);

                                await productStore.updateVideoStatus(product.id, 'completed', undefined, undefined, undefined, null, cloudinaryUrl, supabaseAdmin);
                                console.log(`[Sync Worker] AI 이미지 생성 및 저장 완료! URL: ${cloudinaryUrl}`);
                            } else {
                                await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, aiResult.error || 'AI 이미지 생성 실패', null, null, supabaseAdmin);
                            }
                        } catch (err: any) {
                            console.error(`[Sync Worker] 이미지 생성 오류:`, err);
                            await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, String(err), null, null, supabaseAdmin);
                        }

                        processed++;
                        continue;
                    }

                    if (mediaType !== 'video') {
                        console.log(`[Sync Worker] 비디오/이미지 모드 아님 (${mediaType}), 건너뜀`);
                        await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, `${mediaType} 모드는 모델 생성 미지원`, undefined, undefined, supabaseAdmin);
                        processed++;
                        continue;
                    }

                    // 성별 결정
                    let targetGender: 'female' | 'male' = 'female';
                    if (product.gender === 'unisex') {
                        targetGender = Math.random() < 0.75 ? 'female' : 'male';
                    } else {
                        targetGender = product.gender;
                    }

                    // Veo 트리거 (API 호출 1회, 빠르게 반환) - 상품 이미지를 참조로 전달
                    const veoResult = await triggerVeoVideo({
                        name: product.name,
                        fabric: product.fabric,
                        gender: targetGender,
                        category: product.category,
                        narrationText: product.narrationText || undefined,
                        videoModel: product.videoModel || null,
                    }, product.imageUrl);

                    if (veoResult.success && veoResult.operationName) {
                        await productStore.updateVideoStatus(product.id, 'generating', undefined, undefined, undefined, veoResult.operationName, undefined, supabaseAdmin);
                        console.log(`[Sync Worker] Veo 트리거 성공: ${veoResult.operationName}`);
                    } else {
                        await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, veoResult.error || 'Veo 트리거 실패', undefined, undefined, supabaseAdmin);
                    }

                    processed++;
                }
                // ─────────────────────────────────────────────
                // 2. generating 상태: Veo 상태 확인 → Cloudinary 업로드
                // ─────────────────────────────────────────────
                else if (
                    (product.videoStatus === 'generating' || product.videoStatus === 'tryon_polling' || product.videoStatus === 'video_polling')
                    && product.klingTaskId
                ) {
                    const statusRes = await checkVeoVideo(product.klingTaskId);

                    if (statusRes.status === 'succeed' && statusRes.videoUri) {
                        console.log(`[Sync Worker] Veo 영상 완료, Cloudinary 업로드 시작`);

                        try {
                            // 공식 SDK 패턴으로 영상 다운로드 (API 키를 쿼리 파라미터로 전달)
                            const arrayBuffer = await downloadVeoVideo(statusRes.videoUri);
                            console.log(`[Sync Worker] 영상 다운로드 완료 (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);

                            // Cloudinary에 업로드 → 영구 Public URL 획득
                            const cloudinaryUrl = await uploadVideoToCloudinary(arrayBuffer, product.id);

                            // DB에 Cloudinary Public URL 저장
                            await productStore.updateVideoStatus(product.id, 'completed', cloudinaryUrl, undefined, undefined, null, null, supabaseAdmin);
                            console.log(`[Sync Worker] 완료! Cloudinary URL: ${cloudinaryUrl}`);

                        } catch (uploadError: any) {
                            const errorMsg = uploadError.message || String(uploadError);

                            // 환경변수 미설정 등 치명적 오류는 재시도해도 해결 안 됨 → 즉시 실패 처리
                            const isFatalError = errorMsg.includes('API_KEY') ||
                                errorMsg.includes('API_SECRET') ||
                                errorMsg.includes('설정되지 않았습니다') ||
                                errorMsg.includes('CLOUD_NAME');

                            if (isFatalError) {
                                console.error(`[Sync Worker] 치명적 설정 오류, 실패 처리:`, errorMsg);
                                await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, errorMsg, null, null, supabaseAdmin);
                            } else {
                                // 일시적 오류 → video_error_reason에 재시도 횟수 기록
                                const currentReason = product.videoErrorReason || '';
                                const retryMatch = currentReason.match(/\[retry:(\d+)\]/);
                                const retryCount = retryMatch ? parseInt(retryMatch[1]) + 1 : 1;
                                const MAX_RETRIES = 5;

                                if (retryCount >= MAX_RETRIES) {
                                    console.error(`[Sync Worker] 최대 재시도 횟수(${MAX_RETRIES}) 초과, 실패 처리:`, errorMsg);
                                    await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, errorMsg, null, null, supabaseAdmin);
                                } else {
                                    console.warn(`[Sync Worker] 다운로드/업로드 실패 (${retryCount}/${MAX_RETRIES}), 재시도 예정:`, errorMsg);
                                    await productStore.updateVideoStatus(product.id, 'generating', undefined, undefined, `[retry:${retryCount}] ${errorMsg}`, undefined, undefined, supabaseAdmin);
                                }
                            }
                        }
                    } else if (statusRes.status === 'failed') {
                        await productStore.updateVideoStatus(product.id, 'failed', undefined, undefined, statusRes.error || '영상 생성 실패', null, null, supabaseAdmin);
                    }
                    // running 상태: 다음 폴링 사이클에서 재확인 (상태 변경 없음)
                    processed++;
                }

            } catch (err: any) {
                console.error(`[Sync Worker] 상품 ${product.id} 처리 중 에러:`, err);
            }
        }

        return NextResponse.json({ success: true, processed });

    } catch (error: any) {
        console.error('[Sync Worker] 에러:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
