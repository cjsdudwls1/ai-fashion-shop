"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function CartPage() {
    const router = useRouter();
    const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        setMounted(true);
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
                // Show specific errors
                const errors = invalidItems.map((item: any) =>
                    `${items.find((i: any) => i.id === item.id)?.title}: ${item.message}`
                ).join('\n');
                toast.error(`일부 상품의 재고가 부족합니다:\n${errors}`);
                return; // Stop checkout
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

    if (!mounted) return <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div></div>;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-center -mt-20">
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">장바구니가 비어있습니다</h2>
                        <p className="text-[var(--text-secondary)]">다양한 상품을 경험해보세요.</p>
                    </div>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                        쇼핑하러 가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                    장바구니 <span className="text-[var(--primary-color)] text-2xl">{items.length}</span>
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Cart Items List */}
                    <div className="flex-1 space-y-6">
                        {items.map((item) => (
                            <div
                                key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                                className="group bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 flex gap-6 items-start shadow-sm hover:shadow-md transition-shadow duration-300 border border-[var(--border-color)]"
                            >
                                {/* Product Image (Larger & Aspect Ratio) */}
                                <div className="w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0 relative shadow-inner">
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info & Controls */}
                                <div className="flex-grow flex flex-col justify-between min-h-[144px]"> {/* Height matching image approx */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{item.title}</h3>
                                            <button
                                                onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize)}
                                                className="p-2 -mr-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                                                aria-label="삭제"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
                                            {item.selectedColor && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                                                    Color: <span className="font-medium ml-1 text-[var(--text-primary)]">{item.selectedColor}</span>
                                                </span>
                                            )}
                                            {item.selectedSize && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                                                    Size: <span className="font-medium ml-1 text-[var(--text-primary)]">{item.selectedSize}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mt-4">
                                        <div className="flex items-center gap-3 bg-[var(--bg-elevated)] rounded-lg p-1 border border-[var(--border-color)]">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                                                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors active:scale-95"
                                                disabled={item.quantity <= 1}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                            </button>
                                            <span className="w-8 text-center font-bold text-[var(--text-primary)] text-lg">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                                                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors active:scale-95"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                                            {(item.price * item.quantity).toLocaleString()}원
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Clear Cart Button (Re-positioned for logic separation) */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => {
                                    if (confirm('장바구니를 비우시겠습니까?')) clearCart();
                                }}
                                className="text-sm text-[var(--text-muted)] hover:text-red-500 underline transition-colors"
                            >
                                장바구니 전체 비우기
                            </button>
                        </div>
                    </div>

                    {/* Order Summary (Sticky) */}
                    <div className="lg:w-[380px] flex-shrink-0">
                        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-color)] p-8 sticky top-32">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-color)] pb-4">결제 예상 금액</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-[var(--text-secondary)] text-lg">
                                    <span>총 상품금액</span>
                                    <span>{getTotalPrice().toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)] text-lg">
                                    <span>배송비</span>
                                    <span className="text-[var(--primary-color)]">무료</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-8 pt-4 border-t border-[var(--border-color)]">
                                <span className="text-xl font-bold text-[var(--text-primary)]">총 결제금액</span>
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                                    {getTotalPrice().toLocaleString()}원
                                </span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isChecking}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${isChecking
                                        ? 'bg-gray-400 cursor-wait'
                                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                                    }`}
                            >
                                {isChecking ? '재고 확인 중...' : '주문하기'}
                            </button>

                            <p className="text-xs text-[var(--text-muted)] text-center mt-4">
                                주문 내용은 마이페이지에서 확인하실 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
