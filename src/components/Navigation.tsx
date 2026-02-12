'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function Navigation() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gradient">AI 패션샵</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/products" className="nav-link">
                        제품 보기
                    </Link>
                    <Link href="/admin" className="nav-link">
                        관리자
                    </Link>
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
}
