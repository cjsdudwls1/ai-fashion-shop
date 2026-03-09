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
                    className="py-4 rounded-xl border-2 border-[var(--text-primary)] font-bold text-[var(--text-primary)] bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--bg-dark)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                    장바구니 담기
                </button>
                <button
                    onClick={onBuyNow}
                    disabled={isPurchasing}
                    className={`py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${isPurchasing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]'
                        }`}
                >
                    {isPurchasing ? '구매 처리중...' : '바로 구매하기'}
                </button>
            </div>

            {/* 모바일 Sticky CTA (lg 미만) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]" style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 3fr' }}>
                    <button
                        onClick={onAddToCart}
                        className="py-4 rounded-xl border-2 border-[var(--text-primary)] font-extrabold text-[var(--text-primary)] bg-transparent flex items-center justify-center gap-2 text-base active:scale-95 transition-transform"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        담기
                    </button>
                    <button
                        onClick={onBuyNow}
                        disabled={isPurchasing}
                        className={`py-4 rounded-xl font-extrabold text-base active:scale-95 transition-transform ${isPurchasing
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-[var(--primary-color)] text-white shadow-lg'
                            }`}
                    >
                        {isPurchasing ? '처리중...' : '바로 구매'}
                    </button>
                </div>
            </div>
        </>
    );
}
