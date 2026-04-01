'use client';

import { ChevronDown } from 'lucide-react';
import { Product } from '@/lib/types';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/orderUtils';

interface ProductAccordionProps {
    product: Product;
}

export function ProductAccordion({ product }: ProductAccordionProps) {
    return (
        <div className="mt-20 space-y-8 border-t border-[var(--border-color)] pt-10">
            <details className="group">
                <summary className="flex cursor-pointer items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)] list-none py-2 hover:opacity-70 transition-opacity">
                    <span>DETAILS</span>
                    <span className="transition-transform duration-300 group-open:rotate-180">
                        <ChevronDown size={16} strokeWidth={1.5} />
                    </span>
                </summary>
                <div className="group-open:animate-fadeIn mt-4 text-[var(--text-secondary)] space-y-3 text-[13px] leading-relaxed pb-4">
                    <p>성별: <span className="capitalize text-[var(--text-primary)] font-medium">{product.gender === 'female' ? '여성' : product.gender === 'male' ? '남성' : '남녀공용'}</span></p>
                    <p>등록일: {new Date(product.createdAt).toLocaleDateString()}</p>
                    <p className="leading-7 mt-4">
                        프리미엄 퀄리티의 {product.name}입니다. {product.fabric} 소재로 제작되어 최고의 편안함과 스타일을 제공합니다.
                        {product.gender === 'female' ? '여성분들께' : product.gender === 'male' ? '남성분들께' : '모두에게'} 추천드립니다.
                        AI 피팅 서비스로 미래의 패션 쇼핑을 경험해보세요.
                    </p>
                </div>
            </details>

            <details className="group border-t border-[var(--border-color)] pt-8">
                <summary className="flex cursor-pointer items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)] list-none py-2 hover:opacity-70 transition-opacity">
                    <span>SHIPPING & RETURNS</span>
                    <span className="transition-transform duration-300 group-open:rotate-180">
                        <ChevronDown size={16} strokeWidth={1.5} />
                    </span>
                </summary>
                <div className="group-open:animate-fadeIn mt-4 text-[var(--text-secondary)] space-y-3 text-[13px] leading-relaxed pb-4">
                    <p>🚚 <span className="font-medium text-[var(--text-primary)] ml-1">무료 배송</span> ({FREE_SHIPPING_THRESHOLD.toLocaleString()}원 이상 구매 시)</p>
                    <p className="mt-2">🔄 배송 완료 후 7일 이내 교환/반품 가능 (미착용 및 원본 포장 상태 필수)</p>
                </div>
            </details>
        </div>
    );
}
