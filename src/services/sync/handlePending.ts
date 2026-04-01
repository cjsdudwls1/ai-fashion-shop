/**
 * pending 상태 처리 핸들러
 * 낙관적 잠금 → AI 배경 교체 → 미디어 모드 분기 (image/none/video)
 */
import { productStore } from '@/lib/productStore';
import { uploadVideoToCloudinary, uploadImageToCloudinary } from '@/lib/cloudinaryServer';
import { triggerVeoVideo } from '@/lib/aiVideoService';
import type { SyncContext, SyncHandlerResult } from './types';

export async function handlePending(ctx: SyncContext): Promise<SyncHandlerResult> {
    const { product, supabaseAdmin } = ctx;
    const mediaType = product.mediaGenerationType || 'video';

    // [낙관적 잠금] pending→generating 전환
    const { data: lockResult, error: lockError } = await supabaseAdmin
        .from('products')
        .update({
            video_status: 'generating',
            video_started_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('video_status', 'pending')
        .select('id');

    if (lockError || !lockResult || lockResult.length === 0) {
        console.log(`[Sync Worker] 상품 ${product.id}은 다른 Worker가 이미 처리 중 (낙관적 잠금), 건너뜀`);
        return { processed: true, skipped: true };
    }

    // ── Phase 1: AI 배경 교체 이미지 생성 (모든 미디어 타입에 공통) ──
    // [2026-03-08] 2단계 분리: 이미지 생성과 Veo 트리거를 별도 cycle로 분리
    // 사유: 같은 cycle에서 이미지 + Veo를 호출하면 Veo RPM(2/분) 초과 시
    //       API 키 전체 429 → 이미지(100 RPM 여유)까지 같이 실패
    // 해결: 이미지만 생성하고 return → 다음 폴링에서 Phase 2(Veo) 실행
    if (!product.displayImageUrl) {
        // [2026-03-08] Phase 1 재시도 제한 — 무한 루프 방지
        // 이미지 생성이 반복 실패해도 재시도 제한이 없으면 무한 루프 발생.
        // 최대 3회 초과 시 displayImageUrl 없이 Phase 2로 진행한다.
        // 근거: .docs/veo-pipeline-structural-analysis.md 결함 C
        const MAX_PHASE1_RETRIES = 3;
        const currentReason = product.videoErrorReason || '';
        const phase1Match = currentReason.match(/\[phase1:(\d+)\]/);
        const phase1Count = phase1Match ? parseInt(phase1Match[1]) : 0;

        if (phase1Count >= MAX_PHASE1_RETRIES) {
            console.warn(`[Sync Worker] [Phase 1] 상품 ${product.id}: 이미지 생성 최대 ${MAX_PHASE1_RETRIES}회 실패, displayImageUrl 없이 Phase 2 진행`);
            // Phase 1 스킵 → 아래 Phase 2(미디어 모드 분기)로 fall through
        } else {
            try {
                const { generateCleanProductImage } = await import('@/lib/aiImageService');
                console.log(`[Sync Worker] [Phase 1] AI 배경 교체 이미지 생성 시작 (${phase1Count + 1}/${MAX_PHASE1_RETRIES}): ${product.id}`);

                const bgResult = await generateCleanProductImage(
                    product.imageUrl,
                    { name: product.name, category: product.category }
                );

                if (bgResult.success && bgResult.imageBuffer) {
                    const displayUrl = await uploadImageToCloudinary(bgResult.imageBuffer, `${product.id}_display`);
                    // [2026-03-08] supabaseAdmin 전달: anon key → service_role로 RLS 우회
                    // 근거: .docs/phase1-infinite-loop-rls-solution.md §4-2
                    await productStore.updateProduct(product.id, { displayImageUrl: displayUrl }, supabaseAdmin);
                    console.log(`[Sync Worker] [Phase 1] AI 배경 교체 이미지 저장 완료: ${displayUrl}`);
                } else {
                    console.warn(`[Sync Worker] [Phase 1] AI 배경 교체 실패 (${phase1Count + 1}/${MAX_PHASE1_RETRIES}): ${bgResult.error}`);
                }
            } catch (bgErr: any) {
                console.warn(`[Sync Worker] [Phase 1] AI 배경 교체 오류 (${phase1Count + 1}/${MAX_PHASE1_RETRIES}):`, bgErr.message);
            }

            // [2026-03-08] Phase 1 완료 → 잠금 해제: generating→pending 복원
            // 근거: 14행에서 pending→generating 잠금 후 Phase 1에서 return하면
            //       generating + klingTaskId=null 상태가 되어 sync/route.ts 34~41행의
            //       deadzone 핸들러 진입 조건과 일치 → 무한 롤백 루프 발생 (문서 참조)
            // 해결: pending으로 되돌려서 다음 폴링에서 Phase 2(Veo) 정상 진입
            // 참조: docs/phase1-deadzone-loop-analysis.md - 방법 A
            const nextPhase1Count = phase1Count + 1;
            await productStore.updateVideoStatus({
                id: product.id,
                status: 'pending',
                klingTaskId: null,
                client: supabaseAdmin,
                videoStartedAt: null,
                errorReason: `[phase1:${nextPhase1Count}]`,  // Phase 1 재시도 카운터 기록
            });
            console.log(`[Sync Worker] [Phase 1] 완료 → pending 복원 (잠금 해제, phase1:${nextPhase1Count}). 다음 폴링에서 Phase 2 실행: ${product.id}`);
            return { processed: true };
        }
    }

    // ── image 모드 ──
    if (mediaType === 'image') {
        console.log(`[Sync Worker] AI 이미지 가상 피팅 생성 시작: ${product.id}`);

        try {
            const { generateTryOnImage } = await import('@/lib/aiImageService');

            const genders: ('female' | 'male')[] = product.gender === 'unisex'
                ? ['female', 'male']
                : [product.gender as 'female' | 'male'];

            await productStore.updateVideoStatus({ id: product.id, status: 'generating', klingTaskId: 'image-generation', client: supabaseAdmin });

            let firstImageUrl: string | null = null;
            const errors: string[] = [];

            for (const g of genders) {
                console.log(`[Sync Worker] AI 피팅 이미지 생성 (${g}): ${product.id}`);
                const aiResult = await generateTryOnImage(
                    { name: product.name, fabric: product.fabric, gender: g, category: product.category },
                    product.imageUrl
                );

                if (aiResult.success && aiResult.imageBuffer) {
                    const suffix = product.gender === 'unisex' ? `${product.id}_${g}` : product.id;
                    const cloudinaryUrl = await uploadImageToCloudinary(aiResult.imageBuffer, suffix);
                    console.log(`[Sync Worker] AI 피팅 이미지 (${g}) 업로드 완료: ${cloudinaryUrl}`);

                    if (product.gender === 'unisex') {
                        await productStore.addAiMedia(product.id, g, 'image', cloudinaryUrl, supabaseAdmin);
                    }

                    if (!firstImageUrl) firstImageUrl = cloudinaryUrl;
                } else {
                    console.warn(`[Sync Worker] AI 피팅 이미지 (${g}) 실패: ${aiResult.error}`);
                    if (aiResult.error) errors.push(`${g}: ${aiResult.error}`);
                }
            }

            if (firstImageUrl) {
                await productStore.updateVideoStatus({ id: product.id, status: 'completed', klingTaskId: null, tryonImageUrl: firstImageUrl, client: supabaseAdmin });
                // [2026-03-08] supabaseAdmin 전달: anon key → service_role로 RLS 우회
                // 근거: .docs/phase1-infinite-loop-rls-solution.md §4-2
                await productStore.updateProduct(product.id, { displayImageUrl: firstImageUrl }, supabaseAdmin);
                console.log(`[Sync Worker] AI 피팅 이미지 생성 완료! 대표: ${firstImageUrl}`);
            } else {
                const combinedError = errors.length > 0 ? errors.join(' / ') : '알 수 없는 AI 이미지 생성 실패';
                await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: `AI 이미지 생성 실패: ${combinedError}`, klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
            }
        } catch (err: any) {
            console.error(`[Sync Worker] 이미지 생성 오류:`, err);
            await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: String(err), klingTaskId: null, tryonImageUrl: null, client: supabaseAdmin });
        }

        return { processed: true };
    }

    // ── none 모드 ──
    if (mediaType === 'none') {
        await productStore.updateVideoStatus({ id: product.id, status: 'completed', klingTaskId: null, client: supabaseAdmin });
        console.log(`[Sync Worker] 미디어 생성 없음 모드 (배경 교체만 완료): ${product.id}`);
        return { processed: true };
    }

    // ── 비디오/이미지 모드 아닌 경우 ──
    if (mediaType !== 'video') {
        console.log(`[Sync Worker] 비디오/이미지 모드 아님 (${mediaType}), 건너뜀`);
        await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: `${mediaType} 모드는 모델 생성 미지원`, client: supabaseAdmin });
        return { processed: true };
    }

    // ── video 모드: Veo 트리거 ──
    const targetGender: 'female' | 'male' = product.gender === 'unisex' ? 'female' : (product.gender as 'female' | 'male');

    const veoResult = await triggerVeoVideo({
        name: product.name,
        fabric: product.fabric,
        gender: targetGender,
        category: product.category,
        narrationText: product.narrationText || undefined,
        videoModel: product.videoModel || null,
    }, product.imageUrl);

    if (veoResult.success && veoResult.operationName) {
        await productStore.updateVideoStatus({ id: product.id, status: 'generating', klingTaskId: veoResult.operationName, client: supabaseAdmin, videoStartedAt: new Date() });
        console.log(`[Sync Worker] Veo 트리거 성공 (${targetGender}): ${veoResult.operationName}`);
    } else {
        await productStore.updateVideoStatus({ id: product.id, status: 'failed', errorReason: veoResult.error || 'Veo 트리거 실패', client: supabaseAdmin });
    }

    return { processed: true };
}
