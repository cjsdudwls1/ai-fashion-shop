"use client";

import { useSyncPolling } from '@/hooks/useSyncPolling';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * 전역 Sync 폴러
 * 어떤 페이지에 있든 15초마다 Sync API를 호출하여
 * pending/generating 상태의 상품이 처리될 수 있도록 한다.
 *
 * [2026-03-09] admin layout 종속 제거
 * 기존: AdminVideoSyncer가 admin layout에서만 폴링 → admin을 벗어나면 중단
 * 변경: root layout에 GlobalSyncPoller를 마운트하여 모든 페이지에서 폴링 지속
 */
export default function GlobalSyncPoller() {
    const { isAdmin } = useAdmin();
    useSyncPolling({ enabled: isAdmin, intervalMs: 15000 });
    return null;
}
