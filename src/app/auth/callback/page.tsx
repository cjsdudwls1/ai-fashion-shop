"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                router.push('/login');
                return;
            }

            if (session?.user) {
                // Check if additional profile info is needed
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_setup_finished')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !profile.is_setup_finished) {
                    router.push('/profile/setup');
                } else {
                    router.push('/');
                }
            } else {
                router.push('/login');
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold">로그인 처리 중...</h2>
            </div>
        </div>
    );
}
