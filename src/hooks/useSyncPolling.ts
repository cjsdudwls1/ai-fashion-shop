import { useEffect } from 'react';

interface UseSyncPollingOptions {
    enabled?: boolean;
    intervalMs?: number;
    onTick?: () => void;
}

// 모듈 레벨 상태 관리 (Singleton Timer)
let activeTimerId: NodeJS.Timeout | null = null;
let referenceCount = 0;
const tickCallbacks = new Set<() => void>();

export function useSyncPolling({ enabled = true, intervalMs = 15000, onTick }: UseSyncPollingOptions = {}) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // 콜백 등록
        if (onTick) {
            tickCallbacks.add(onTick);
        }

        referenceCount++;

        // 타이머 시작 (첫 마운트 시)
        if (referenceCount === 1 && !activeTimerId) {
            const tick = async () => {
                try {
                    await fetch('/api/admin/videos/sync', { method: 'GET' });
                } catch (err) {
                    console.error('[useSyncPolling] Sync 호출 실패:', err);
                }

                // 등록된 모든 콜백 실행
                tickCallbacks.forEach(callback => callback());
            };

            // 즉시 1회 실행 후 setInterval 시작
            tick();
            activeTimerId = setInterval(tick, intervalMs);
        }

        // 언마운트 처리
        return () => {
            if (onTick) {
                tickCallbacks.delete(onTick);
            }

            referenceCount--;

            // 참조하는 컴포넌트가 더 이상 없으면 타이머 정리
            if (referenceCount === 0 && activeTimerId) {
                clearInterval(activeTimerId);
                activeTimerId = null;
            }
        };
    }, [enabled, intervalMs, onTick]);
}
