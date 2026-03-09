"use client";

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getShippingFee } from '@/lib/orderUtils';
import { syncLatestPrices } from '@/services/priceService';
import { CartEmptyState } from '@/components/cart/CartEmptyState';
import { CartItemCard } from '@/components/cart/CartItemCard';
import OrderSummary from '@/components/checkout/OrderSummary';

export default function CartPage() {
    const router = useRouter();
    const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        setMounted(true);
        syncLatestPrices();
    }, []);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        setIsChecking(true);
        try {
            // 1. Validate Stock
            const response = await fetch('/api/cart/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || '재고 확인 중 오류');

            const invalidItems = data.results.filter((res: any) => !res.valid);

            if (invalidItems.length > 0) {
                const errors = invalidItems.map((item: any) =>
                    `${items.find((i: any) => i.id === item.id)?.title}: ${item.message}`
                ).join('\n');
                toast.error(`일부 상품의 재고가 부족합니다:\n${errors}`);
                return;
            }

            // 2. Navigate to Checkout if valid
            router.push('/checkout');

        } catch (error) {
            console.error(error);
            toast.error('주문 처리 중 오류가 발생했습니다.');
        } finally {
            setIsChecking(false);
        }
    };

    if (!mounted) return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
        </div>
    );

    if (items.length === 0) {
        return <CartEmptyState />;
    }

    const totalPrice = getTotalPrice();
    const finalPrice = totalPrice + getShippingFee(totalPrice);

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] cart-page-wrapper" style={{ paddingTop: '100px', paddingBottom: '120px' }}>
            {/* 중앙 정렬 컨테이너 — 1160px */}
            <div style={{
                maxWidth: '1160px',
                margin: '0 auto',
                padding: '0 24px',
            }}>
                <h1 style={{
                    fontSize: '24px', fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '32px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    장바구니
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'var(--text-primary)', color: 'var(--bg-dark)',
                        padding: '2px 10px', borderRadius: '999px',
                        fontSize: '13px', fontWeight: 700,
                        minWidth: '28px', height: '24px',
                    }}>
                        {items.length}
                    </span>
                </h1>

                {/* 2단 레이아웃: 상품 목록(좌) + 결제 요약(우) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="lg:!flex-row lg:!gap-[40px]">
                    {/* 좌측: 상품 목록 */}
                    <div style={{ flex: '7 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {items.map((item) => (
                            <CartItemCard
                                key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                                item={item}
                                onRemove={removeItem}
                                onQuantityChange={updateQuantity}
                            />
                        ))}

                        {/* Clear Cart */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                            <button
                                onClick={() => {
                                    if (confirm('장바구니를 비우시겠습니까?')) clearCart();
                                }}
                                className="hover-color-danger"
                                style={{
                                    padding: '8px 12px', fontSize: '13px', fontWeight: 500,
                                    color: 'var(--text-muted)', background: 'none', border: 'none',
                                    cursor: 'pointer', textDecoration: 'underline',
                                    textUnderlineOffset: '4px',
                                }}
                            >
                                장바구니 전체 비우기
                            </button>
                        </div>
                    </div>

                    {/* 우측: 결제 예상 금액 (Sticky) */}
                    <div className="max-lg:!max-w-full max-lg:!min-w-0" style={{ flex: '3 1 0%', minWidth: '320px', maxWidth: '400px' }}>
                        <OrderSummary
                            items={items}
                            totalPrice={totalPrice}
                            isProcessing={isChecking}
                            onPayment={handleCheckout}
                            titleText="결제 예상 금액"
                            ctaText="주문하기"
                            processingText="재고 확인 중..."
                            footerText="회원가입 없이 비회원으로도 구매가 가능합니다."
                        />
                    </div>
                </div>
            </div>

            {/* Mobile: 하단 sticky 주문 버튼 */}
            <div className="checkout-mobile-sticky-btn lg:hidden">
                <button
                    onClick={handleCheckout}
                    disabled={isChecking}
                    className="checkout-cta-btn"
                >
                    {isChecking ? '재고 확인 중...' : `${finalPrice.toLocaleString()}원 주문하기`}
                </button>
            </div>
        </div>
    );
}
