import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifySyncAuth, handlePending, handleGenerating, handleDeadzone } from '@/services/sync';
import type { SyncContext } from '@/services/sync';

// Vercel Pro 타임아웃 확장 (초 단위)
export const maxDuration = 60;

// Netlify / Vercel Serverless 타임아웃 호환 Polling API
// 한 번의 호출에 1개 상품만 처리하여 타임아웃 방지
// 워크플로우: pending → generating → completed / failed
export async function GET(request: NextRequest) {
    // 인증: 관리자 계정 또는 CRON_SECRET 헤더 필수
    const forbidden = await verifySyncAuth(request);
    if (forbidden) return forbidden;

    try {
        // [2026-03-08] supabaseAdmin 전달: RLS SELECT 정책 우회
        // 근거: .docs/veo-pipeline-structural-analysis.md 결함 B
        const pendingProducts = await productStore.getPendingVideoProducts(1, supabaseAdmin);

        let processed = 0;

        for (const product of pendingProducts) {
            console.log(`[Sync Worker] 상품 ${product.id} 상태 처리: ${product.videoStatus}`);

            const ctx: SyncContext = { product, supabaseAdmin };

            try {
                // 1. pending 상태
                if (product.videoStatus === 'pending') {
                    await handlePending(ctx);
                    processed++;
                }
                // 1-b. generating/generating_male + klingTaskId 없음 → 사각지대
                else if (
                    (product.videoStatus === 'generating' || product.videoStatus === 'generating_male')
                    && !product.klingTaskId
                ) {
                    await handleDeadzone(ctx);
                    processed++;
                }
                // 2. generating/generating_male + klingTaskId 있음
                else if (
                    (product.videoStatus === 'generating' || product.videoStatus === 'generating_male')
                    && product.klingTaskId
                ) {
                    await handleGenerating(ctx);
                    processed++;
                }

            } catch (err: any) {
                console.error(`[Sync Worker] 상품 ${product.id} 처리 중 에러:`, err);
                // 예외 발생 시 generating 상태 롤백
                try {
                    const { data: current } = await supabaseAdmin
                        .from('products')
                        .select('video_status')
                        .eq('id', product.id)
                        .single();
                    const currentStatus = current?.video_status;
                    if (currentStatus === 'generating' || currentStatus === 'generating_male') {
                        await productStore.updateVideoStatus(
                            product.id, 'failed', undefined, undefined,
                            `처리 중 예외: ${String(err).substring(0, 200)}`,
                            null, null, supabaseAdmin
                        );
                        console.warn(`[Sync Worker] 상품 ${product.id}: ${currentStatus} → failed 롤백 완료`);
                    }
                } catch (rollbackErr) {
                    console.error(`[Sync Worker] 롤백 실패:`, rollbackErr);
                }
            }
        }

        return NextResponse.json({ success: true, processed });

    } catch (error: any) {
        console.error('[Sync Worker] 에러:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
