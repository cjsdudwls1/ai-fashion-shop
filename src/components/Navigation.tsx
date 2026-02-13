'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function Navigation() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-300">
            <nav className="container-main h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-8 h-8 flex items-center justify-center border border-[var(--text-primary)] transition-all duration-300 group-hover:bg-[var(--text-primary)]">
                        <svg className="w-5 h-5 text-[var(--text-primary)] group-hover:text-[var(--bg-dark)] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-light tracking-tight">AI FASHION</span>
                </Link>

                <div className="flex items-center gap-8">
                    <Link href="/products" className="nav-link text-sm uppercase tracking-wider">
                        SHOP
                    </Link>
                    <Link href="/admin" className="nav-link text-sm uppercase tracking-wider">
                        ADMIN
                    </Link>
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
}
