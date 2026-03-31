'use client'

import React from 'react'
import { CreditCard, Landmark } from 'lucide-react'

export type PaymentMethodType = 'card' | 'bank_transfer'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType
  onMethodSelect: (method: PaymentMethodType) => void
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">결제 수단</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onMethodSelect('card')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedMethod === 'card'
              ? 'border-black bg-black/5 text-black'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <span className="font-medium">신용/체크카드</span>
        </button>
        
        <button
          type="button"
          onClick={() => onMethodSelect('bank_transfer')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedMethod === 'bank_transfer'
              ? 'border-black bg-black/5 text-black'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          <Landmark className="w-6 h-6 mb-2" />
          <span className="font-medium">무통장입금</span>
        </button>
      </div>
    </div>
  )
}
