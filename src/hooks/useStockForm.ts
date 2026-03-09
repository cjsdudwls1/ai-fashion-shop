'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { StockItem } from '@/types/adminTypes';

// [2026-03-06] 그룹 E: useProductForm에서 재고 관련 상태/핸들러 추출
// 사유: useProductForm이 24개 반환값을 가져 Props Drilling 및 복잡성 증가
// 재고 관리 관심사를 독립 훅으로 분리하여 단일 책임 원칙(SRP) 준수
// 근거: .docs/refactoring-group-e-hooks.md — useStockForm 분리
export function useStockForm() {
    const [stockList, setStockList] = useState<StockItem[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number | string>(1);

    /** 재고 추가 핸들러 */
    const handleAddStock = () => {
        if (!selectedColor) return;
        if (!selectedSize) return;

        const qty = Number(quantity);
        if (isNaN(qty) || qty < 1) {
            toast.error('유효한 수량을 입력해주세요.');
            return;
        }

        const existingIndex = stockList.findIndex(
            item => item.color === selectedColor && item.size === selectedSize
        );

        if (existingIndex >= 0) {
            const newList = [...stockList];
            newList[existingIndex].quantity += qty;
            setStockList(newList);
        } else {
            setStockList([
                ...stockList,
                {
                    id: Date.now(),
                    color: selectedColor,
                    size: selectedSize,
                    quantity: qty,
                },
            ]);
        }
        setQuantity(1);
    };

    /** 재고 삭제 핸들러 */
    const handleRemoveStock = (id: number) => {
        setStockList(stockList.filter(item => item.id !== id));
    };

    return {
        stockList,
        selectedColor,
        selectedSize,
        quantity,
        setSelectedColor,
        setSelectedSize,
        setQuantity,
        handleAddStock,
        handleRemoveStock,
    };
}
