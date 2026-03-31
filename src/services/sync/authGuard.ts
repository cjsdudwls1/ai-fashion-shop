/**
 * Sync API 인증 가드
 * [2026-03-31] CRON_SECRET 방식 → 관리자 계정 인증으로 교체
 * 사유: CRON_SECRET이 미설정 시 누구나 호출 가능한 보안 취약점 해소
 * 관리자(admin role) 또는 유효한 CRON_SECRET 헤더가 있어야 호출 가능
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Sync API 호출 권한을 검증한다.
 * 1순위: CRON_SECRET 헤더 (외부 Cron 서비스용)
 * 2순위: 로그인된 관리자 계정 (브라우저 폴링용)
 * @returns null이면 인증 통과, NextResponse이면 차단 응답
 */
export async function verifySyncAuth(request: NextRequest): Promise<NextResponse | null> {
    // 1. CRON_SECRET 헤더 검증 (외부 Cron 서비스, Netlify Scheduled Functions 등)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('x-cron-secret');
        if (authHeader === cronSecret) return null;
    }

    // 2. Supabase 세션 기반 관리자 인증 (브라우저 폴링)
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => {
                        // NextRequest에서 쿠키 추출
                        const cookieHeader = request.headers.get('cookie') || '';
                        return cookieHeader.split(';').map(c => {
                            const [name, ...rest] = c.trim().split('=');
                            return { name, value: rest.join('=') };
                        }).filter(c => c.name);
                    },
                    setAll: () => {
                        // 읽기 전용 — 쿠키 설정 불필요
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (data?.role === 'admin') return null;
        }
    } catch (err) {
        console.warn('[Sync Auth] 세션 검증 오류:', err);
    }

    console.warn('[Sync Auth] 미인증 호출 차단');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
