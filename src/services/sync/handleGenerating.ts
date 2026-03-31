/**
 * generating/generating_male 상태 처리 핸들러
 * Veo 상태 확인 → 성공 시 Cloudinary 업로드 → unisex male 트리거 → completed/failed
 */
import { productStore } from '@/lib/productStore';
import {
    triggerVeoVideo,
    checkVeoVideo,
    downloadVeoVideo,
} from '@/lib/aiVideoService';
import { uploadVideoToCloudinary } from '@/lib/cloudinaryServer';
import type { SyncContext, SyncHandlerResult } from './types';

const TIMEOUT_MS = 15 * 60 * 1000; // 15분

// [2026-03-06] 서버 측 폴링 스로틀링
// Veo 영상 생성은 최소 2~8분 소요. 영상 트리거 후 2분 미만에는 폴링해도
// 완료 상태일 가능성이 극히 낮으므로, 불필요한 API 호출(과금)을 방지한다.
// 클라이언트는 15초마다 sync API를 호출하지만, 실제 Gemini API 호출은 최소 2분 간격.
// 근거: https://ai.google.dev/gemini-api/docs/video — 공식 예제도 10초 간격 폴링 사용
const MIN_POLL_DELAY_MS = 2 * 60 * 1000; // 최소 2분 경과 후 첫 폴링

export async function handleGenerating(ctx: SyncContext): Promise<SyncHandlerResult> {
    const { product, supabaseAdmin } = ctx;

    // image-generation 상태면 건너뜀 (이미지 모드는 pending에서 동기 처리됨)
    if (product.klingTaskId === 'image-generation') {
        return { processed: true, skipped: true };
    }

    // [타임아웃 검사]
    if (product.videoStartedAt) {
        const elapsedMs = Date.now() - new Date(product.videoStartedAt).getTime();
        if (elapsedMs > TIMEOUT_MS) {
            const elapsedMin = Math.round(elapsedMs / 60000);
            console.error(`[Sync Worker] 상품 ${product.id} 영상 생성 타임아웃 (${elapsedMin}분 경과, 최대 15분)`);
            await productStore.updateVideoStatus({
                id: product.id,
                status: 'failed',
                errorReason: `타임아웃: ${elapsedMin}분 경과 (최대 15분)`,
                klingTaskId: null,
                tryonImageUrl: null,
                client: supabaseAdmin
            });
            return { processed: true };
        }
    }

    // [서버 측 폴링 스로틀링] video_started_at 기준 2분 미경과 시 API 호출 생략
    // Veo 영상 생성은 최소 2~8분 소요 → 2분 미만에는 폴링해봐야 무조건 'running'
    // 이 로직으로 실제 Gemini API 호출을 대폭 줄여 과금을 방지한다.
    if (product.videoStartedAt) {
        const elapsedMs = Date.now() - new Date(product.videoStartedAt).getTime();
        if (elapsedMs < MIN_POLL_DELAY_MS) {
            const remainSec = Math.round((MIN_POLL_DELAY_MS - elapsedMs) / 1000);
            console.log(`[Sync Worker] 상품 ${product.id}: 폴링 스로틀링 (${remainSec}초 후 첫 폴링), API 호출 생략`);
            return { processed: true, skipped: true };
        }
    }

    const isGeneratingMale = product.videoStatus === 'generating_male';
    const currentGender = isGeneratingMale ? 'male' : 'female';
    const statusRes = await checkVeoVideo(product.klingTaskId!);

    if (statusRes.status === 'succeed') {
        console.log(`[Sync Worker] Veo 영상 완료 (${currentGender}), Cloudinary 업로드 시작`);

        try {
            let arrayBuffer: ArrayBuffer;
            
            if (statusRes.videoUri) {
                arrayBuffer = await downloadVeoVideo(statusRes.videoUri);
                console.log(`[Sync Worker] 영상 다운로드 완료(URI) (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);
            } else if (statusRes.videoBytes) {
                // Base64 문자열을 Buffer로 디코딩 후 ArrayBuffer로 변환
                const buffer = Buffer.from(statusRes.videoBytes, 'base64');
                arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                console.log(`[Sync Worker] 영상 디코딩 완료(Base64) (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);
            } else {
                throw new Error('비디오 데이터(URI 또는 Bytes)가 전달되지 않았습니다.');
            }

            const videoSuffix = product.gender === 'unisex' ? `${product.id}_${currentGender}` : product.id;
            const cloudinaryUrl = await uploadVideoToCloudinary(arrayBuffer, videoSuffix);

            // unisex: product_ai_media에 저장
            if (product.gender === 'unisex') {
                await productStore.addAiMedia(product.id, currentGender as 'male' | 'female', 'video', cloudinaryUrl, supabaseAdmin);
            }

            // unisex + female 완료 → male 트리거로 전환
            if (product.gender === 'unisex' && !isGeneratingMale) {
                await productStore.updateVideoStatus({ id: product.id, status: 'generating_male', videoUrl: cloudinaryUrl, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
                console.log(`[Sync Worker] female 영상 완료, male 트리거 시작`);

                const maleVeoResult = await triggerVeoVideo({
                    name: product.name,
                    fabric: product.fabric,
                    gender: 'male',
                    category: product.category,
                    narrationText: product.narrationText || undefined,
                    videoModel: product.videoModel || null,
                }, product.imageUrl);

                if (maleVeoResult.success && maleVeoResult.operationName) {
                    await productStore.updateVideoStatus({ id: product.id, status: 'generating_male', klingTaskId: maleVeoResult.operationName, client: supabaseAdmin });
                    console.log(`[Sync Worker] male Veo 트리거 성공: ${maleVeoResult.operationName}`);
                } else {
                    console.warn(`[Sync Worker] male Veo 트리거 실패, female 영상만으로 완료 처리`);
                    await productStore.updateVideoStatus({ id: product.id, status: 'completed', errorReason: `male 영상 트리거 실패: ${maleVeoResult.error}`, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
                }
            } else {
                // 단일 성별 또는 male 완료 → completed
                if (!isGeneratingMale) {
                    await productStore.updateVideoStatus({ id: product.id, status: 'completed', videoUrl: cloudinaryUrl, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
                } else {
                    await productStore.updateVideoStatus({ id: product.id, status: 'completed', klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
                }
                console.log(`[Sync Worker] 완료! Cloudinary URL: ${cloudinaryUrl}`);
            }

        } catch (uploadError: any) {
            const errorMsg = uploadError.message || String(uploadError);

            const isFatalError = errorMsg.includes('API_KEY') ||
                errorMsg.includes('API_SECRET') ||
                errorMsg.includes('설정되지 않았습니다') ||
                errorMsg.includes('CLOUD_NAME');

            if (isFatalError) {
                console.error(`[Sync Worker] 치명적 설정 오류, 실패 처리:`, errorMsg);
                await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: errorMsg, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
            } else {
                const currentReason = product.videoErrorReason || '';
                const retryMatch = currentReason.match(/\[retry:(\d+)\]/);
                const retryCount = retryMatch ? parseInt(retryMatch[1]) + 1 : 1;
                const MAX_RETRIES = 5;

                if (retryCount >= MAX_RETRIES) {
                    console.error(`[Sync Worker] 최대 재시도 횟수(${MAX_RETRIES}) 초과, 실패 처리:`, errorMsg);
                    await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: errorMsg, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
                } else {
                    console.warn(`[Sync Worker] 다운로드/업로드 실패 (${retryCount}/${MAX_RETRIES}), 재시도 예정:`, errorMsg);
                    const retryStatus = isGeneratingMale ? 'generating_male' : 'generating';
                    await productStore.updateVideoStatus({ id: product.id, status: retryStatus as any, errorReason: `[retry:${retryCount}] ${errorMsg}`, client: supabaseAdmin });
                }
            }
        }
    } else if (statusRes.status === 'failed') {
        if (product.gender === 'unisex' && !isGeneratingMale) {
            console.warn(`[Sync Worker] female 영상 실패, male 시도`);
            const maleVeoResult = await triggerVeoVideo({
                name: product.name,
                fabric: product.fabric,
                gender: 'male',
                category: product.category,
                narrationText: product.narrationText || undefined,
                videoModel: product.videoModel || null,
            }, product.imageUrl);

            if (maleVeoResult.success && maleVeoResult.operationName) {
                await productStore.updateVideoStatus({ id: product.id, status: 'generating_male', errorReason: `female 실패: ${statusRes.error}`, klingTaskId: maleVeoResult.operationName, client: supabaseAdmin });
            } else {
                await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: `female: ${statusRes.error}, male 트리거 실패: ${maleVeoResult.error}`, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
            }
        } else {
            await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: statusRes.error || '영상 생성 실패', klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
        }
    }
    // running 상태: 다음 폴링 사이클에서 재확인 (상태 변경 없음)

    return { processed: true };
}
