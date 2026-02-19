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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Admin Authorization Protection
    // Protects the /admin route from unauthorized access
    // [개발용] 관리자 페이지 접근 제한 해제 (빠른 테스트를 위함)
    /*
    if (false && request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            // If not logged in, redirect to login page
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        // Check Admin Role
        // 1. Check specific email (hardcoded for safety/simplicity in this stage)
        // 2. Check 'is_admin' metadata (future proofing)
        // 3. Check 'role' metadata (standard pattern)
        const isAdmin =
            user.email === 'admin@fashion.local' ||
            user.user_metadata?.is_admin === true ||
            user.user_metadata?.role === 'admin' ||
            user.app_metadata?.role === 'admin';

        if (!isAdmin) {
            console.warn(`[Middleware] Unauthorized access attempt to /admin by ${user.email}`);
            // Redirect unauthorized users to home
            return NextResponse.redirect(new URL('/', request.url))
        }
    }
    */

    // 2. Profile Setup Enforcement
    if (user) {
        // Check if on setup page already
        if (request.nextUrl.pathname === '/profile/setup') {
            return response
        }

        // Check metadata for setup completion
        // Note: We rely on user_metadata.is_setup_finished to be true
        // If it's missing or false, we redirect to setup
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
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|login|auth|api|checkout|order-lookup|cart|products).*)',
    ],
}
