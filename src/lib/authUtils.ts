import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';

// 인증 에러 코드 (매직 문자열 방지)
export const AUTH_ERROR = {
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    FORBIDDEN: 'FORBIDDEN',
} as const;

/**
 * Supabase 서버 클라이언트를 생성한다.
 * Server Component, Route Handler, Server Action 전용.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Component에서 호출 시 무시 가능
                    }
                },
            },
        }
    );
}

/**
 * 현재 인증된 사용자를 반환한다.
 * 미인증 상태이면 null을 반환한다.
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

/**
 * 현재 사용자의 관리자 여부를 반환한다.
 * supabaseAdmin(서비스 역할 키)을 사용하여 RLS를 우회하여 profiles 테이블의 role 컬럼을 조회한다.
 */
export async function isAdminUser(user: User | null): Promise<boolean> {
    if (!user) return false;
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    return data?.role === 'admin';
}

/**
 * 관리자가 아니면 에러를 던진다.
 * API Route Handler 가드용.
 *
 * @throws AUTH_ERROR.UNAUTHENTICATED - 로그인하지 않은 경우
 * @throws AUTH_ERROR.FORBIDDEN - 관리자 역할이 없는 경우
 */
export async function requireAdmin(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) throw new Error(AUTH_ERROR.UNAUTHENTICATED);
    if (!(await isAdminUser(user))) throw new Error(AUTH_ERROR.FORBIDDEN);
    return user;
}

/**
 * requireAdmin 에러를 표준 Response로 변환하는 헬퍼.
 * API Route의 catch 블록에서 사용한다.
 */
export function handleAuthError(e: unknown): Response | null {
    if (e instanceof Error) {
        if (e.message === AUTH_ERROR.UNAUTHENTICATED) {
            return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }
        if (e.message === AUTH_ERROR.FORBIDDEN) {
            return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }
    }
    return null;
}
