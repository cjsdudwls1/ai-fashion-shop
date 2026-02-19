import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();

    // Create Supabase client for server component
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // [개발용] 관리자 페이지 접근 제한 해제
    /*
    // Check if user is logged in
    if (!user) {
        redirect('/login?next=/admin');
    }

    // Check Admin Role
    const isAdmin =
        user.email === 'admin@fashion.local' ||
        user.user_metadata?.is_admin === true ||
        user.user_metadata?.role === 'admin' ||
        user.app_metadata?.role === 'admin';

    if (!isAdmin) {
        redirect('/');
    }
    */

    return (
        <div className="admin-layout">
            {/* Optional: Add Admin Sidebar here */}
            {children}
        </div>
    );
}
