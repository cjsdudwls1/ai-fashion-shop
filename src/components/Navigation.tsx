'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { User } from '@supabase/supabase-js';
import { useCartStore } from '@/store/cartStore';
import { Menu, X, ShoppingBag, User as UserIcon, LogOut, Package, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const clearCart = useCartStore((state) => state.clearCart);

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

    // 페이지 이동 시 모바일 메뉴 닫기
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const checkAdmin = async (currentUser: User | null) => {
        if (!currentUser) {
            setIsAdmin(false);
            return;
        }
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();
        setIsAdmin(data?.role === 'admin');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        clearCart();
        setIsMobileMenuOpen(false);
        router.push('/');
        router.refresh();
    };

    const isCheckout = pathname === '/checkout';

    return (
        <>
            <header className="sticky top-0 left-0 right-0 z-50 bg-[var(--bg-dark)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-300">
                <nav className="container-main h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="w-6 h-6 flex items-center justify-center border border-[var(--text-primary)] transition-all duration-300 group-hover:bg-[var(--text-primary)]">
                            <svg className="w-3.5 h-3.5 text-[var(--text-primary)] group-hover:text-[var(--bg-dark)] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-lg font-medium tracking-wide truncate mt-0.5">AI FASHION</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 lg:gap-10">
                        {!isCheckout && (
                            <>
                                <Link href="/products" className="nav-link text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[var(--primary-color)] transition-colors">
                                    쇼핑하기
                                </Link>
                                <Link href="/partnership" className="nav-link text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[var(--primary-color)] transition-colors">
                                    문의
                                </Link>

                                {isAdmin && (
                                    <Link href="/admin" className="nav-link text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-[var(--primary-hover)]">
                                        관리자
                                    </Link>
                                )}

                                <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

                                {/* Desktop Cart */}
                                <Link href="/cart" className="relative group p-1">
                                    <ShoppingBag className="w-5 h-5 text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-colors" />
                                    <CartBadge />
                                </Link>
                            </>
                        )}

                        {/* Desktop Auth Links */}
                        {user ? (
                            <>
                                <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[var(--primary-color)] transition-colors">
                                    <UserIcon className="w-4 h-4" />
                                    <span>마이페이지</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/order-lookup" className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[var(--primary-color)] transition-colors">
                                    주문 조회
                                </Link>
                                <Link href="/login" className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[var(--primary-color)] transition-colors">
                                    로그인
                                </Link>
                            </>
                        )}

                        <ThemeToggle />
                    </div>

                    {/* Mobile Navigation Controls */}
                    <div className="flex items-center gap-4 md:hidden z-50">
                        {!isCheckout && (
                            <Link href="/cart" className="relative p-1">
                                <ShoppingBag className="w-6 h-6" />
                                <CartBadge />
                            </Link>
                        )}

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 -mr-1 focus:outline-none"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile Menu Overlay - header 외부에 배치하여 전체 화면 커버 */}
            <div className={cn(
                "fixed inset-0 z-[45] md:hidden transition-transform duration-300 ease-in-out pt-20 px-6 overflow-y-auto bg-white dark:bg-[#020617]",
                isMobileMenuOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"
            )}>
                <div className="flex flex-col gap-6 text-lg font-medium">
                    <div className="py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Menu</span>
                        <ThemeToggle />
                    </div>

                    <Link href="/products" className="flex items-center gap-3 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <Package className="w-5 h-5" />
                        쇼핑하기
                    </Link>

                    <Link href="/partnership" className="flex items-center gap-3 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShieldCheck className="w-5 h-5" />
                        문의
                    </Link>

                    {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-3 py-2 text-indigo-500" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShieldCheck className="w-5 h-5" />
                            관리자 페이지
                        </Link>
                    )}

                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                    {user ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-3 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                <UserIcon className="w-5 h-5" />
                                <span>마이페이지</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 py-2 text-red-500 text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 mt-2">
                            <Link
                                href="/order-lookup"
                                className="flex items-center justify-center w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                비회원 주문 조회
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center justify-center w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                로그인 / 회원가입
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
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
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center justify-center min-w-[20px] min-h-[20px] shadow-sm">
            {totalItems}
        </span>
    );
}
