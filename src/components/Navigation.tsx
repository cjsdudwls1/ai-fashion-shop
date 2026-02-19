'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { User } from '@supabase/supabase-js';
import { useCartStore } from '@/store/cartStore';

export function Navigation() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 초기 세션 확인
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            checkAdmin(user);
        };
        checkUser();

        // 인증 상태 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            checkAdmin(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = (currentUser: User | null) => {
        // [개발용] 모든 사용자에게 관리자 메뉴 노출
        setIsAdmin(true);
        return;

        /*
        if (!currentUser) {
            setIsAdmin(false);
            return;
        }
        // 간단한 관리자 체크 (이메일 기반 또는 메타데이터)
        // 실제 운영 시에는 DB의 role 등을 체크하는 것이 좋습니다.
        const isAdminUser = currentUser.email === 'admin@fashion.local' || currentUser.user_metadata?.is_admin === true;
        setIsAdmin(isAdminUser);
        */
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh(); // UI 갱신
    };

    return (
        <header className="sticky top-0 left-0 right-0 z-50 bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-300">
            <nav className="container-main h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-8 h-8 flex items-center justify-center border border-[var(--text-primary)] transition-all duration-300 group-hover:bg-[var(--text-primary)]">
                        <svg className="w-5 h-5 text-[var(--text-primary)] group-hover:text-[var(--bg-dark)] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-light tracking-tight">AI FASHION</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/products" className="nav-link text-sm font-medium tracking-wide">
                        쇼핑하기
                    </Link>
                    <Link href="/partnership" className="nav-link text-sm font-medium tracking-wide">
                        제휴 문의
                    </Link>

                    {/* Shopping Cart Icon */}
                    <Link href="/cart" className="relative group p-2">
                        <svg className="w-6 h-6 text-[var(--text-primary)] hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <CartBadge />
                    </Link>

                    {isAdmin && (
                        <Link href="/admin" className="nav-link text-sm font-medium tracking-wide text-indigo-500">
                            관리자
                        </Link>
                    )}

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>

                    {user ? (
                        <>
                            <Link href="/profile" className="nav-link text-sm font-medium tracking-wide">
                                마이페이지
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="nav-link text-sm font-medium tracking-wide hover:text-red-500 transition-colors"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/order-lookup" className="nav-link text-sm font-medium tracking-wide">
                                주문 조회
                            </Link>
                            <Link href="/login" className="nav-link text-sm font-medium tracking-wide">
                                로그인
                            </Link>
                        </>
                    )}

                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
}

function CartBadge() {
    const totalItems = useCartStore((state) => state.getTotalItems());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || totalItems === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px]">
            {totalItems}
        </span>
    );
}
