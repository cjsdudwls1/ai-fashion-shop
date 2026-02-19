"use client";

import React from 'react';
import { CartItem } from '@/store/cartStore';

interface OrderSummaryProps {
    items: CartItem[];
}

export default function OrderSummary({ items }: OrderSummaryProps) {
    return (
        <section className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">주문 상품 ({items.length}개)</h2>
            <div className="space-y-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                    <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4 border-b border-[var(--border-color)] pb-4 last:border-0 last:pb-0">
                        <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-lg flex-shrink-0 overflow-hidden">
                            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <p className="font-medium text-sm text-[var(--text-primary)]">{item.title}</p>
                            <div className="text-xs text-[var(--text-secondary)] space-x-1">
                                {item.selectedColor && <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{item.selectedColor}</span>}
                                {item.selectedSize && <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{item.selectedSize}</span>}
                            </div>
                            <p className="text-[var(--text-secondary)] text-xs mt-1">{item.price.toLocaleString()}원 x {item.quantity}개</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
