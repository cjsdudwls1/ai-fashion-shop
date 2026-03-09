/**
 * AI Sync Worker fire-and-forget 트리거
 * 상품 등록 후 비동기로 Sync API를 킥오프한다.
 * 실패 시 에러를 로깅하되 호출자에게 전파하지 않는다.
 */

export function triggerSync(host: string | null, isDev: boolean): void {
    if (!host) {
        console.warn('[triggerSync] host 헤더 없음, sync 트리거 스킵');
        return;
    }

    const protocol = isDev ? 'http' : 'https';
    const url = `${protocol}://${host}/api/admin/videos/sync`;

    fetch(url, { method: 'GET' }).catch((err) => {
        // fire-and-forget: 실패해도 상품 등록은 이미 완료 상태
        console.error(`[triggerSync] Sync Worker 킥오프 실패 (비치명적): ${err.message || err}`);
    });
}
