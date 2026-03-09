"use client";

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function CartEmptyState() {
    return (
        <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-center -mt-20">
            <div className="text-center space-y-6">
                <div style={{
                    width: '96px', height: '96px',
                    background: 'var(--bg-elevated)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)'
                }}>
                    <ShoppingBag size={40} color="var(--text-muted)" strokeWidth={1.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>장바구니가 비어있습니다</h2>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>다양한 상품을 경험해보세요.</p>
                </div>
                <Link
                    href="/products"
                    className="hover-brightness"
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: '14px 40px', fontSize: '16px', fontWeight: 700,
                        borderRadius: 'var(--radius-md)', color: '#fff',
                        background: 'var(--primary-color)',
                        textDecoration: 'none',
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    쇼핑하러 가기
                </Link>
            </div>
        </div>
    );
}
