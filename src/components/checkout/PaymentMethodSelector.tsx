'use client'

import React from 'react'
import { CreditCard, Landmark } from 'lucide-react'
import { isCardPaymentAvailable } from '@/lib/portone'

export type PaymentMethodType = 'card' | 'bank_transfer'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType
  onMethodSelect: (method: PaymentMethodType) => void
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect
}: PaymentMethodSelectorProps) {
  const cardAvailable = isCardPaymentAvailable()

  return (
    <section className="checkout-section">
      <h2 className="checkout-section-title">결제 수단</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => cardAvailable && onMethodSelect('card')}
          disabled={!cardAvailable}
          className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            !cardAvailable
              ? 'border-[var(--border-color)] bg-transparent text-[var(--text-muted)] cursor-not-allowed opacity-50'
              : selectedMethod === 'card'
                ? 'border-[var(--primary-color)] bg-[var(--bg-elevated)] text-[var(--primary-color)]'
                : 'border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <span className="font-medium">신용/체크카드</span>
          {!cardAvailable && (
            <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-color)]">
              준비중
            </span>
          )}
        </button>
        
        <button
          type="button"
          onClick={() => onMethodSelect('bank_transfer')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedMethod === 'bank_transfer'
              ? 'border-[var(--primary-color)] bg-[var(--bg-elevated)] text-[var(--primary-color)]'
              : 'border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Landmark className="w-6 h-6 mb-2" />
          <span className="font-medium">무통장입금</span>
        </button>
      </div>
    </section>
  )
}
