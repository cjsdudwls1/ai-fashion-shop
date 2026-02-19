"use client";

import React from 'react';

interface PaymentSectionProps {
    totalPrice: number;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    loading: boolean;
}

export default function PaymentSection({ totalPrice, paymentMethod, setPaymentMethod, loading }: PaymentSectionProps) {
    return (
        <div className="space-y-6">
            <section className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] sticky top-24">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">결제 금액</h2>

                <div className="space-y-3 mb-6 font-medium">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>총 상품금액</span>
                        <span>{totalPrice.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>배송비</span>
                        <span>0원</span>
                    </div>
                </div>

                <div className="border-t border-[var(--border-color)] pt-6 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[var(--text-primary)]">최종 결제 금액</span>
                        <span className="text-3xl font-black text-indigo-500">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>

                <h3 className="font-bold text-[var(--text-primary)] mb-3">결제 수단</h3>
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === 'card' ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-dark)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
                    >
                        신용카드
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('kakao')}
                        className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === 'kakao' ? 'border-[#FEE500] bg-[#FEE500] text-[#3A1D1D]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
                    >
                        카카오페이
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-indigo-600 text-white text-xl font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                >
                    {loading ? '결제 진행 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
                </button>

                <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
                    위 결제 버튼은 실제 승인이 발생하지 않는 <span className="font-bold text-[var(--text-secondary)]">테스트 결제</span>입니다.
                </p>
            </section>
        </div>
    );
}
