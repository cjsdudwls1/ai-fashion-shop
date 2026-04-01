'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { useCartStore } from '@/store/cartStore';
import { useAdmin } from '@/hooks/useAdmin';
import { Menu, X, ShoppingBag, User as UserIcon, LogOut, Package, ShieldCheck, ChevronRight, MessageCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin } = useAdmin();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const clearCart = useCartStore((state) => state.clearCart);

    // 페이지 이동 시 모바일 메뉴 닫기
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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
            <header className="sticky top-0 left-0 right-0 z-50 bg-[var(--bg-dark)]/80 backdrop-blur-xl transition-all duration-500">
                <nav className="container-main h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="w-6 h-6 flex items-center justify-center border border-[var(--text-primary)] transition-all duration-300 group-hover:bg-[var(--text-primary)]">
                            <Zap className="w-3.5 h-3.5 text-[var(--text-primary)] group-hover:text-[var(--bg-dark)] transition-colors duration-300" />
                        </div>
                        <span className="text-xl font-bold font-serif tracking-[0.2em] truncate mt-0.5">AI FASHION</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 lg:gap-10">
                        {!isCheckout && (
                            <>
                                <Link href="/products" className="nav-link text-[13px] uppercase tracking-widest font-semibold text-gray-900 dark:text-gray-100 hover:opacity-60 transition-opacity">
                                    SHOP
                                </Link>
                                <Link href="/partnership" className="nav-link text-[13px] uppercase tracking-widest font-semibold text-gray-900 dark:text-gray-100 hover:opacity-60 transition-opacity">
                                    CONTACT
                                </Link>

                                {isAdmin && (
                                    <Link href="/admin" className="nav-link text-[13px] uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-70">
                                        ADMIN
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
                                <Link href="/profile" className="flex items-center gap-2 text-[13px] uppercase tracking-widest font-semibold text-gray-900 dark:text-gray-100 hover:opacity-60 transition-opacity">
                                    <UserIcon className="w-4 h-4" />
                                    <span>MY PAGE</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-[13px] uppercase tracking-widest font-semibold text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/order-lookup" className="text-[13px] uppercase tracking-widest font-semibold text-gray-900 dark:text-gray-100 hover:opacity-60 transition-opacity">
                                    TRACK ORDER
                                </Link>
                                <Link href="/login" className="text-[13px] uppercase tracking-widest font-semibold text-gray-900 dark:text-gray-100 hover:opacity-60 transition-opacity">
                                    LOGIN
                                </Link>
                            </>
                        )}

                        <ThemeToggle />
                    </div>

                    {/* Mobile Navigation Controls */}
                    <div className="flex items-center gap-3 md:hidden z-50">
                        <ThemeToggle />

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
                <div className="flex flex-col gap-2 text-lg font-medium">
                    {/* 헤더 */}
                    <div className="py-4 border-b border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
                        <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">Menu</span>
                        <ThemeToggle />
                    </div>

                    {/* 쇼핑 그룹 */}
                    <div className="mt-3 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-1 block">쇼핑</span>
                        <Link
                            href="/products"
                            className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-[var(--text-primary)]">쇼핑하기</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">전체 상품 둘러보기</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                        </Link>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800/50 mx-2"></div>

                    {/* 고객지원 그룹 */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-1 block">고객지원</span>
                        <Link
                            href="/partnership"
                            className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-[var(--text-primary)]">문의</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">파트너십 및 제휴 문의</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                        </Link>
                    </div>

                    {isAdmin && (
                        <>
                            <div className="h-px bg-gray-100 dark:bg-gray-800/50 mx-2"></div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-1 block">관리</span>
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-violet-600 dark:text-violet-400">관리자 페이지</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">상품 및 주문 관리</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                                </Link>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-gray-100 dark:bg-gray-800/50 mx-2 my-1"></div>

                    {/* 계정 영역 */}
                    {user ? (
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-1 block">계정</span>
                            <Link
                                href="/profile"
                                className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-5 h-5 text-sky-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[var(--text-primary)]">마이페이지</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">주문 내역 및 프로필</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors text-left active:scale-[0.98]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                </div>
                                <span className="font-semibold text-red-500">로그아웃</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 mt-3">
                            <Link
                                href="/order-lookup"
                                className="flex items-center justify-center gap-2 w-full py-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-[var(--text-primary)] font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Package className="w-4 h-4" />
                                비회원 주문 조회
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 w-full py-4 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <UserIcon className="w-4 h-4" />
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
        <span className="absolute -top-0.5 -right-0.5 bg-[var(--text-primary)] text-[var(--bg-dark)] text-[10px] font-bold rounded-full flex items-center justify-center w-4 h-4 ring-2 ring-[var(--bg-dark)] transition-transform duration-300 transform scale-100">
            {totalItems}
        </span>
    );
}
