"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
    const router = useRouter();
    const { items, updateQuantity, removeItem, updatePrices, getTotalPrice, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        setMounted(true);

        const fetchLatestPrices = async () => {
            const currentItems = useCartStore.getState().items;
            if (currentItems.length === 0) return;

            const ids = [...new Set(currentItems.map(item => item.id))];
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, price')
                    .in('id', ids);

                if (!error && data) {
                    const priceMap: Record<string, number> = {};
                    data.forEach(p => { priceMap[p.id] = p.price; });
                    useCartStore.getState().updatePrices(priceMap);
                }
            } catch (err) {
                console.error("Failed to fetch latest prices", err);
            }
        };

        fetchLatestPrices();
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
                        <svg style={{ width: '40px', height: '40px', color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>장바구니가 비어있습니다</h2>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>다양한 상품을 경험해보세요.</p>
                    </div>
                    <Link
                        href="/products"
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '14px 40px', fontSize: '16px', fontWeight: 700,
                            borderRadius: 'var(--radius-md)', color: '#fff',
                            background: 'var(--primary-color)',
                            textDecoration: 'none',
                            transition: 'filter 0.2s, transform 0.15s',
                            boxShadow: 'var(--shadow-md)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            </div>
        );
    }

    const totalPrice = getTotalPrice();

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
                            <div
                                key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '20px',
                                    alignItems: 'flex-start',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'box-shadow 0.2s ease',
                                }}
                                className="group hover:shadow-md"
                            >
                                {/* Product Image */}
                                <div style={{
                                    width: '100px', flexShrink: 0, position: 'relative',
                                    aspectRatio: '3/4', borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden', backgroundColor: 'var(--bg-elevated)',
                                }}>
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-muted)',
                                        }}>
                                            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info & Controls */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{
                                                fontSize: '16px', fontWeight: 700,
                                                color: 'var(--text-primary)',
                                                lineHeight: 1.4,
                                                overflow: 'hidden', display: '-webkit-box',
                                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            }}>
                                                {item.title}
                                            </h3>
                                            <button
                                                onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize)}
                                                style={{
                                                    padding: '8px', marginLeft: '12px',
                                                    color: 'var(--text-muted)',
                                                    borderRadius: '50%', border: 'none', background: 'none',
                                                    cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
                                                    flexShrink: 0,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = '#ef4444';
                                                    e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'var(--text-muted)';
                                                    e.currentTarget.style.background = 'none';
                                                }}
                                                aria-label="삭제"
                                            >
                                                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {item.selectedColor && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    fontSize: '12px', color: 'var(--text-secondary)',
                                                    background: 'var(--bg-elevated)',
                                                    padding: '3px 10px', borderRadius: '4px',
                                                    border: '1px solid var(--border-color)',
                                                }}>
                                                    {item.selectedSize ? 'Color:' : 'Option:'} <span style={{ fontWeight: 600, marginLeft: '4px', color: 'var(--text-primary)' }}>{item.selectedColor}</span>
                                                </span>
                                            )}
                                            {item.selectedSize && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    fontSize: '12px', color: 'var(--text-secondary)',
                                                    background: 'var(--bg-elevated)',
                                                    padding: '3px 10px', borderRadius: '4px',
                                                    border: '1px solid var(--border-color)',
                                                }}>
                                                    Size: <span style={{ fontWeight: 600, marginLeft: '4px', color: 'var(--text-primary)' }}>{item.selectedSize}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '12px' }}>
                                        {/* 수량 조절 */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '2px',
                                            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                                            padding: '2px', border: '1px solid var(--border-color)',
                                        }}>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                style={{
                                                    width: '32px', height: '32px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: '4px', border: 'none', background: 'none',
                                                    cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                                    color: 'var(--text-secondary)',
                                                    opacity: item.quantity <= 1 ? 0.4 : 1,
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                            </button>
                                            <span style={{
                                                width: '28px', textAlign: 'center',
                                                fontWeight: 700, fontSize: '14px',
                                                color: 'var(--text-primary)',
                                            }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                                                style={{
                                                    width: '32px', height: '32px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: '4px', border: 'none', background: 'none',
                                                    cursor: 'pointer', color: 'var(--text-secondary)',
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>

                                        {/* 가격 */}
                                        <div style={{ textAlign: 'right' }}>
                                            {item.quantity > 1 && (
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                                    {item.price.toLocaleString()}원 x {item.quantity}
                                                </p>
                                            )}
                                            <p style={{
                                                fontSize: '18px', fontWeight: 700,
                                                color: 'var(--text-primary)', letterSpacing: '-0.02em',
                                            }}>
                                                {(item.price * item.quantity).toLocaleString()}원
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Clear Cart */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                            <button
                                onClick={() => {
                                    if (confirm('장바구니를 비우시겠습니까?')) clearCart();
                                }}
                                style={{
                                    padding: '8px 12px', fontSize: '13px', fontWeight: 500,
                                    color: 'var(--text-muted)', background: 'none', border: 'none',
                                    cursor: 'pointer', textDecoration: 'underline',
                                    textUnderlineOffset: '4px', transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                                장바구니 전체 비우기
                            </button>
                        </div>
                    </div>

                    {/* 우측: 결제 예상 금액 (Sticky) */}
                    <div className="max-lg:!max-w-full max-lg:!min-w-0" style={{ flex: '3 1 0%', minWidth: '320px', maxWidth: '400px' }}>
                        <div className="order-summary-card">
                            <h3 className="order-summary-title">결제 예상 금액</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <span>총 상품금액</span>
                                    <span>{totalPrice.toLocaleString()}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <span>배송비</span>
                                    <span style={{ color: 'var(--checkout-gray-500)', fontWeight: 500 }}>무료</span>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                paddingTop: '16px', marginBottom: '24px',
                                borderTop: '1px solid var(--border-color)',
                            }}>
                                <span className="order-summary-total-label">총 결제금액</span>
                                <span className="order-summary-total-price">
                                    {totalPrice.toLocaleString()}원
                                </span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isChecking}
                                className="checkout-cta-btn"
                            >
                                {isChecking ? '재고 확인 중...' : '주문하기'}
                            </button>

                            <p style={{
                                fontSize: '12px', color: 'var(--text-muted)',
                                textAlign: 'center', marginTop: '12px',
                            }}>
                                회원가입 없이 비회원으로도 구매가 가능합니다.
                            </p>
                        </div>
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
                    {isChecking ? '재고 확인 중...' : `${totalPrice.toLocaleString()}원 주문하기`}
                </button>
            </div>
        </div>
    );
}
