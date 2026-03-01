"use client";

import React from 'react';
import { CartItem } from '@/store/cartStore';

interface OrderSummaryProps {
    items: CartItem[];
    totalPrice: number;
    isProcessing: boolean;
    onPayment: () => void;
    hideCta?: boolean;
}

export default function OrderSummary({ items, totalPrice, isProcessing, onPayment, hideCta = false }: OrderSummaryProps) {
    return (
        <section className="order-summary-card">
            <h2 className="order-summary-title">주문 요약</h2>

            {/* Items List — 썸네일 72px (#7) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                {items.map((item, idx) => (
                    <div
                        key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${idx}`}
                        style={{
                            display: 'flex',
                            gap: '16px',
                            paddingBottom: '16px',
                            borderBottom: idx < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}
                    >
                        {/* 썸네일 72px (#7-1) */}
                        <div className="checkout-thumb">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.title} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    No Img
                                </div>
                            )}
                        </div>

                        {/* 상품 정보 — 단가/수량/소계 구조 (#7-2) */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.title}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {item.selectedColor && (
                                    <span style={{ display: 'inline-block', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                        {item.selectedColor}
                                    </span>
                                )}
                                {item.selectedSize && (
                                    <span style={{ display: 'inline-block', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                        {item.selectedSize}
                                    </span>
                                )}
                            </div>
                            {/* 단가 x 수량 = 소계 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {item.price.toLocaleString()}원 x {item.quantity}개
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {(item.price * item.quantity).toLocaleString()}원
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Summary */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                    <span>총 상품금액</span>
                    <span>{totalPrice.toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    <span>배송비</span>
                    {/* #3: 무료 텍스트는 Gray 500으로 (#3-1) */}
                    <span style={{ color: 'var(--checkout-gray-500)', fontWeight: 500 }}>무료</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="order-summary-total-label">총 결제금액</span>
                    <span className="order-summary-total-price">
                        {totalPrice.toLocaleString()}원
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
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                처리 중...
                            </>
                        ) : (
                            `${totalPrice.toLocaleString()}원 결제하기`
                        )}
                    </button>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                        위 주문 내용을 확인하였으며 결제에 동의합니다.
                    </p>
                </>
            )}
        </section>
    );
}
