"use client";

import { useEffect } from 'react';

/**
 * 이 컴포넌트는 관리자 페이지가 열려있는 동안 주기적으로 백그라운드 영상 생성 폴링 API를 호출합니다.
 * Vercel/Netlify 등 서버리스 환경에서 긴 트랜잭션 타임아웃 오류를 피하기 위해
 * 클라이언트 단에서 짧은 주기로 틱(tick)을 트리거하는 역할을 합니다.
 */
export default function AdminVideoSyncer() {
    useEffect(() => {
        // 15초마다 틱 발생 (Sync API는 가벼운 상태 확인만 수행하므로 부하가 적음)
        const SYNC_INTERVAL_MS = 15000;

        const tick = async () => {
            try {
                await fetch('/api/admin/videos/sync', { method: 'GET' });
            } catch (err) {
                console.error('[AdminVideoSyncer] Sync 호출 실패:', err);
            }
        };

        // 초기 마운트 시 한 번 호출
        tick();

        const timer = setInterval(tick, SYNC_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []);

    // 렌더링되는 UI는 없습니다.
    return null;
}
