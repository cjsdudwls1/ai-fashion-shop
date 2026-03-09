/**
 * CRON_SECRET 인증 가드
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * x-cron-secret 헤더를 검증한다.
 * @returns null이면 인증 통과, NextResponse이면 차단 응답
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return null;

    const authHeader = request.headers.get('x-cron-secret');
    if (authHeader === cronSecret) return null;

    // 내부 호출 여부 확인
    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';
    const isInternalCall = referer.includes(host);
    if (isInternalCall) return null;

    console.warn('[Sync Worker] 예외 호출 차단');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
