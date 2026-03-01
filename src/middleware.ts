import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            // Invalid Refresh Token 등 인증 오류 시 세션 삭제 후 비로그인 처리
            if (
                error.message?.includes('Refresh Token Not Found') ||
                error.message?.includes('Invalid Refresh Token') ||
                error.status === 400 ||
                error.status === 401
            ) {
                await supabase.auth.signOut()
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                response = NextResponse.redirect(url)
                return response
            }
        } else {
            user = data.user
        }
    } catch {
        // 네트워크 오류 등 예외 발생 시 비로그인 상태로 처리
    }

    // 1. Admin 로그인 여부만 체크 (role 검증은 admin/layout.tsx에서 DB 조회로 처리)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            // 미로그인 시 로그인 페이지로 리다이렉트
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
        // role 검증은 admin/layout.tsx 서버 컴포넌트에서 profiles DB 조회로 처리
    }

    // 2. Profile Setup Enforcement
    // 로그인한 사용자가 프로필 설정을 완료하지 않은 경우 설정 페이지로 강제 이동
    if (user) {
        if (request.nextUrl.pathname === '/profile/setup') {
            return response
        }

        const isSetupFinished = user.user_metadata.is_setup_finished === true

        if (!isSetupFinished) {
            return NextResponse.redirect(new URL('/profile/setup', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - auth (auth callback)
         * - api (API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|login|auth|api|checkout|order-lookup|cart|products|$).*)',
    ],
}
