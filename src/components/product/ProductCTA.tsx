'use client';

import { ShoppingBag } from 'lucide-react';

interface ProductCTAProps {
    onAddToCart: () => void;
    onBuyNow: () => void;
    isPurchasing: boolean;
}

export function ProductCTA({ onAddToCart, onBuyNow, isPurchasing }: ProductCTAProps) {
    return (
        <>
            {/* 데스크톱 CTA 버튼 (lg 이상) */}
            <div className="mt-10 hidden lg:grid grid-cols-2 gap-4">
                <button
                    onClick={onAddToCart}
                    className="py-[18px] border border-[var(--text-primary)] text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-primary)] bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--bg-dark)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                    ADD TO CART
                </button>
                <button
                    onClick={onBuyNow}
                    disabled={isPurchasing}
                    className={`py-[18px] text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 active:scale-[0.98] relative overflow-hidden group ${isPurchasing
                        ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'bg-[var(--text-primary)] text-[var(--bg-dark)] shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-[1px]'
                        }`}
                >
                    <span className="relative z-10">{isPurchasing ? 'PROCESSING...' : 'BUY NOW'}</span>
                    {!isPurchasing && (
                        <div className="absolute inset-0 h-full w-full bg-black/10 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                </button>
            </div>

            {/* 모바일 Sticky CTA (lg 미만) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]" style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 3fr' }}>
                    <button
                        onClick={onAddToCart}
                        className="py-[16px] border border-[var(--text-primary)] text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--text-primary)] bg-[var(--bg-dark)] flex items-center justify-center gap-1 active:bg-[var(--text-primary)] active:text-[var(--bg-dark)] transition-colors"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        CART
                    </button>
                    <button
                        onClick={onBuyNow}
                        disabled={isPurchasing}
                        className={`py-[16px] text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${isPurchasing
                            ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                            : 'bg-[var(--text-primary)] text-[var(--bg-dark)]'
                            }`}
                    >
                        {isPurchasing ? 'PROCESSING...' : 'BUY NOW'}
                    </button>
                </div>
            </div>
        </>
    );
}
