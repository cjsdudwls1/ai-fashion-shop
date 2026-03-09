'use client';

/**
 * useAdmin 커스텀 훅
 * 클라이언트 컴포넌트에서 관리자 역할을 확인하는 공용 훅.
 * Navigation.tsx, products/page.tsx 등에서 중복되던 admin 확인 로직을 통합.
 *
 * [AbortError Fix] ignore 플래그로 Strict Mode 이중 마운트 시
 * 언마운트된 컴포넌트 상태 업데이트를 방지한다.
 * 참고: https://react.dev/reference/react/useEffect#fetching-data-with-effects
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UseAdminReturn {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
}

export function useAdmin(): UseAdminReturn {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        const checkAdmin = async (currentUser: User | null) => {
            if (!currentUser) {
                if (!ignore) {
                    setUser(null);
                    setIsAdmin(false);
                    setLoading(false);
                }
                return;
            }

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single();

                if (!ignore) {
                    setUser(currentUser);
                    setIsAdmin(data?.role === 'admin');
                    setLoading(false);
                }
            } catch (error) {
                if (!ignore) {
                    console.error('[useAdmin] 관리자 권한 확인 오류:', error);
                    setUser(currentUser);
                    setIsAdmin(false);
                    setLoading(false);
                }
            }
        };

        // 초기 세션 확인
        const init = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!ignore) {
                    await checkAdmin(currentUser);
                }
            } catch (error) {
                if (!ignore) {
                    console.error('[useAdmin] 세션 확인 오류:', error);
                    setLoading(false);
                }
            }
        };
        init();

        // 인증 상태 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!ignore) {
                checkAdmin(session?.user || null);
            }
        });

        return () => {
            ignore = true;
            subscription.unsubscribe();
        };
    }, []);

    return { user, isAdmin, loading };
}
