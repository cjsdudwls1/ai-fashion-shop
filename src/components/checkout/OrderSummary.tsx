"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { CartItem } from '@/store/cartStore';
import { getShippingFee, FREE_SHIPPING_THRESHOLD } from '@/lib/orderUtils';

interface OrderSummaryProps {
    items: CartItem[];
    totalPrice: number;
    isProcessing: boolean;
    onPayment: () => void;
    hideCta?: boolean;
    ctaText?: string;
    processingText?: string;
    footerText?: string;
    titleText?: string;
}

export default function OrderSummary({
    items,
    totalPrice,
    isProcessing,
    onPayment,
    hideCta = false,
    ctaText,
    processingText = '처리 중...',
    footerText = '위 주문 내용을 확인하였으며 결제에 동의합니다.',
    titleText = '주문 요약'
}: OrderSummaryProps) {
    const shippingFee = getShippingFee(totalPrice);
    const finalPrice = totalPrice + shippingFee;
    return (
        <section className="order-summary-card">
            <h2 className="order-summary-title">{titleText}</h2>

            {/* Items List — 썸네일 72px (#7) */}
            <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto mb-6 pr-1">
                {items.map((item, idx) => (
                    <div
                        key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${idx}`}
                        className={`flex gap-4 pb-4 ${idx < items.length - 1 ? 'border-b border-[var(--border-color)]' : ''}`}
                    >
                        {/* 썸네일 72px (#7-1) */}
                        <div className="checkout-thumb">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.title} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-[11px]">
                                    No Img
                                </div>
                            )}
                        </div>

                        {/* 상품 정보 — 단가/수량/소계 구조 (#7-2) */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                                {item.title}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.selectedColor && (
                                    <span className="inline-block text-[12px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                                        {item.selectedColor}
                                    </span>
                                )}
                                {item.selectedSize && (
                                    <span className="inline-block text-[12px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                                        {item.selectedSize}
                                    </span>
                                )}
                            </div>
                            {/* 단가 x 수량 = 소계 */}
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[12px] text-[var(--text-muted)]">
                                    {item.price.toLocaleString()}원 x {item.quantity}개
                                </span>
                                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                                    {(item.price * item.quantity).toLocaleString()}원
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Summary */}
            <div className="border-t border-[var(--border-color)] pt-4 mb-6">
                <div className="flex justify-between text-[var(--text-secondary)] text-[14px] mb-3">
                    <span>총 상품금액</span>
                    <span>{totalPrice.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)] text-[14px] mb-4">
                    <span>배송비</span>
                    {shippingFee === 0 ? (
                        <span className="text-[var(--checkout-gray-500)] font-medium">무료</span>
                    ) : (
                        <span className="font-medium">{shippingFee.toLocaleString()}원</span>
                    )}
                </div>
                {shippingFee > 0 && (
                    <p className="text-[12px] text-[var(--text-muted)] mb-4 -mt-2">
                        {FREE_SHIPPING_THRESHOLD.toLocaleString()}원 이상 구매 시 배송비 무료
                    </p>
                )}
                <div className="border-t border-[var(--border-color)] pt-4 flex justify-between items-center">
                    <span className="order-summary-total-label">총 결제금액</span>
                    <span className="order-summary-total-price">
                        {finalPrice.toLocaleString()}원
                    </span>
                </div>
            </div>

            {/* Payment Button — desktop (#4) */}
            {!hideCta && (
                <>
                    <button
                        onClick={onPayment}
                        disabled={isProcessing}
                        className="checkout-cta-btn"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 text-white inline-block mr-2 -mt-0.5" />
                                {processingText}
                            </>
                        ) : (
                            ctaText || `${finalPrice.toLocaleString()}원 결제하기`
                        )}
                    </button>
                    <p className="text-[12px] text-[var(--text-muted)] text-center mt-3">
                        {footerText}
                    </p>
                </>
            )}
        </section>
    );
}
