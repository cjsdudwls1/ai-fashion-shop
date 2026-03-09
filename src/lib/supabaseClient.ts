// Supabase 클라이언트 공통 유틸리티
// DNS IPv4 우회 + 재시도 로직이 포함된 customFetch를 한 곳에서 관리한다.
// productStore.ts와 supabaseAdmin.ts에서 중복되던 코드를 통합.

// Node.js 환경에서 가끔 발생하는 Supabase 도메인 DNS (IPv6) 해석 실패 버그 우회
if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    try {
        const dns = require('node:dns');
        if (dns && dns.setDefaultResultOrder) {
            dns.setDefaultResultOrder('ipv4first');
        }
    } catch (e) {
        // 브라우저나 Edge 환경일 경우 무시
    }
}

/**
 * Fetch 캐싱을 우회하고 일시적 네트워크 오류 시 재시도하는 커스텀 fetch.
 * Supabase 클라이언트에 주입하여 사용한다.
 */
export const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            // Next.js의 fetch 캐싱을 우회하기 위해 cache: 'no-store' 추가
            const res = await fetch(url, { ...options, cache: 'no-store' });
            return res;
        } catch (err: unknown) {
            lastError = err;
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[Supabase Fetch] 시도 ${i + 1}/${maxRetries} 실패: ${message}`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
    }
    throw lastError;
};
