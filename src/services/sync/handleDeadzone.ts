/**
 * generating/generating_male 상태에서 klingTaskId가 없는 사각지대 복구 핸들러
 * 낙관적 잠금 후 Veo 트리거 전에 서버가 크래시한 경우 발생.
 */
import { productStore } from '@/lib/productStore';
import type { SyncContext, SyncHandlerResult } from './types';

const INIT_TIMEOUT_MS = 2 * 60 * 1000; // 2분
// [2026-03-06] deadzone 무한 롤백 방지
// 사유: generating 상태에서 klingTaskId 없이 고착 → pending 롤백 → 다시 generating → 고착
//       이 루프가 반복될 때마다 AI API가 다시 호출되어 과금이 누적됨
const MAX_DEADZONE_RETRIES = 3;

export async function handleDeadzone(ctx: SyncContext): Promise<SyncHandlerResult> {
    const { product, supabaseAdmin } = ctx;

    // video_started_at 기준 2분 이내이면 정상 처리 중으로 판단
    if (product.videoStartedAt) {
        const elapsed = Date.now() - new Date(product.videoStartedAt).getTime();
        if (elapsed < INIT_TIMEOUT_MS) {
            console.log(`[Sync Worker] 상품 ${product.id}: generating 초기화 중 (${Math.round(elapsed / 1000)}초 경과, 최대 ${INIT_TIMEOUT_MS / 1000}초), 건너뜀`);
            return { processed: true, skipped: true };
        }
    }

    // 2분 초과 또는 video_started_at 미존재 → 롤백 시도
    // 롤백 횟수 확인 (video_error_reason에서 [deadzone:N] 태그 파싱)
    const currentReason = product.videoErrorReason || '';
    const retryMatch = currentReason.match(/\[deadzone:(\d+)\]/);
    const retryCount = retryMatch ? parseInt(retryMatch[1]) + 1 : 1;

    if (retryCount > MAX_DEADZONE_RETRIES) {
        console.error(`[Sync Worker] 상품 ${product.id}: deadzone 최대 ${MAX_DEADZONE_RETRIES}회 롤백 초과 → failed 처리`);
        await productStore.updateVideoStatus({
            id: product.id,
            status: 'failed',
            errorReason: `deadzone 최대 ${MAX_DEADZONE_RETRIES}회 롤백 초과`,
            klingTaskId: null,
            client: supabaseAdmin,
            videoStartedAt: null,
        });
        return { processed: true };
    }

    console.warn(`[Sync Worker] 상품 ${product.id}: ${product.videoStatus} 상태이나 klingTaskId 없음 → pending으로 롤백 (${retryCount}/${MAX_DEADZONE_RETRIES})`);
    await productStore.updateVideoStatus({
        id: product.id,
        status: 'pending',
        klingTaskId: null,
        client: supabaseAdmin,
        videoStartedAt: null,
        errorReason: `[deadzone:${retryCount}] 롤백`,
    });
    return { processed: true };
}
