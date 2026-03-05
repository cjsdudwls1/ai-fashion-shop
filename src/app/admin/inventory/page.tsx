'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// Supabase 클라이언트
// ─────────────────────────────────────────────
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'
);

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────
interface ColorStock {
    color: string;
    quantity: number;
}

interface SizeStock {
    size: string;
    quantity: number;
}

interface Product {
    id: string;
    name: string;
    image_url: string;
    colors: ColorStock[];
    sizes: SizeStock[];
    price: number;
    created_at: string;
}

interface SkuItem {
    name: string;
    quantity: number;
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const COLOR_OPTIONS = [
    '선택', 'Free', '블랙', '화이트', '그레이', '네이비',
    '베이지', '브라운', '레드', '블루', '그린', '옐로우', '핑크', '직접 입력',
];
const SIZE_OPTIONS = ['선택', 'Free', '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '직접 입력'];

// ─────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────

/** Product의 colors/sizes를 통합된 SKU 목록으로 변환 */
function buildSkuList(product: Product): SkuItem[] {
    const skus: SkuItem[] = [];
    const { colors, sizes } = product;

    if (colors?.length > 0 && sizes?.length > 0) {
        colors.forEach(c => {
            sizes.forEach(s => {
                skus.push({ name: `${c.color} / ${s.size}`, quantity: Math.min(c.quantity, s.quantity) });
            });
        });
    } else if (colors?.length > 0) {
        colors.forEach(c => skus.push({ name: c.color, quantity: c.quantity }));
    } else if (sizes?.length > 0) {
        sizes.forEach(s => skus.push({ name: s.size, quantity: s.quantity }));
    }

    return skus;
}

/** SKU 배열의 총 재고를 계산 */
function calcTotalStock(skus: SkuItem[]): number {
    return skus.reduce((sum, s) => sum + s.quantity, 0);
}

// ─────────────────────────────────────────────
// 아이콘 컴포넌트
// ─────────────────────────────────────────────
function RefreshIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function ImagePlaceholderIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function ArrowDownIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: 수량 조절 컨트롤
// ─────────────────────────────────────────────
interface QuantityControlProps {
    value: number;
    onChange: (newValue: number) => void;
}

function QuantityControl({ value, onChange }: QuantityControlProps) {
    const btnClass =
        'w-12 h-12 flex items-center justify-center text-lg font-medium bg-gray-50 hover:bg-gray-200 text-gray-700 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] dark:text-gray-300 transition-colors focus:outline-none';

    return (
        <div className="flex items-center rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shrink-0">
            <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className={btnClass}>-</button>
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-12 text-center text-base font-medium border-x border-[var(--border-color)] bg-transparent focus:outline-none text-[var(--text-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => onChange(value + 1)} className={btnClass}>+</button>
        </div>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: SKU 아이템 행
// ─────────────────────────────────────────────
interface SkuListItemProps {
    sku: SkuItem;
    onQuantityChange: (newValue: number) => void;
    onRemove: () => void;
}

function SkuListItem({ sku, onQuantityChange, onRemove }: SkuListItemProps) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0 group gap-4">
            <div className="flex-1 min-w-0 pr-4">
                <span className="font-medium text-lg text-[var(--text-primary)] tracking-wide truncate block">{sku.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <QuantityControl value={sku.quantity} onChange={onQuantityChange} />
                <button
                    onClick={onRemove}
                    className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-red-500 rounded-lg transition-colors focus:outline-none"
                    title="옵션 삭제"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: 옵션 선택 드롭다운
// ─────────────────────────────────────────────
interface OptionSelectorProps {
    label: string;
    options: string[];
    selectedValue: string;
    onSelectChange: (value: string) => void;
    customValue: string;
    onCustomChange: (value: string) => void;
    placeholder: string;
}

function OptionSelector({ label, options, selectedValue, onSelectChange, customValue, onCustomChange, placeholder }: OptionSelectorProps) {
    const selectClass =
        'w-full sm:w-52 px-5 py-3 text-base font-medium border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20 text-[var(--text-primary)] cursor-pointer transition-all shrink-0';
    const inputClass =
        'w-full sm:flex-1 min-w-[120px] px-5 py-3 text-base font-medium border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20 text-[var(--text-primary)] transition-all shrink';

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
            <span className="text-base font-semibold sm:w-16 text-[var(--text-secondary)] pl-1 shrink-0">{label}</span>
            <div className="flex flex-col sm:flex-row gap-2 flex-1 relative w-full overflow-hidden">
                <select
                    value={selectedValue}
                    onChange={(e) => {
                        onSelectChange(e.target.value);
                        if (e.target.value !== '직접 입력') onCustomChange('');
                    }}
                    className={selectClass}
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {selectedValue === '직접 입력' && (
                    <input
                        type="text"
                        value={customValue}
                        onChange={(e) => onCustomChange(e.target.value)}
                        placeholder={placeholder}
                        className={inputClass}
                    />
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: 새 옵션 추가 폼
// ─────────────────────────────────────────────
interface AddOptionFormProps {
    colorSelect: string;
    sizeSelect: string;
    colorCustom: string;
    sizeCustom: string;
    onColorSelectChange: (v: string) => void;
    onSizeSelectChange: (v: string) => void;
    onColorCustomChange: (v: string) => void;
    onSizeCustomChange: (v: string) => void;
    onAdd: () => void;
}

function AddOptionForm({
    colorSelect, sizeSelect, colorCustom, sizeCustom,
    onColorSelectChange, onSizeSelectChange,
    onColorCustomChange, onSizeCustomChange,
    onAdd,
}: AddOptionFormProps) {
    const previewColor = colorSelect === '직접 입력' ? colorCustom.trim() : (colorSelect === '선택' ? '' : colorSelect);
    const previewSize = sizeSelect === '직접 입력' ? sizeCustom.trim() : (sizeSelect === '선택' ? '' : sizeSelect);
    const previewText = [previewColor, previewSize].filter(Boolean).join(' / ') || '선택 없음';

    return (
        <div className="p-6 sm:p-8 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl relative overflow-hidden mt-6">
            <h4 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                새로운 옵션 추가
            </h4>

            <div className="flex flex-col gap-6 w-full">
                <OptionSelector
                    label="색상"
                    options={COLOR_OPTIONS}
                    selectedValue={colorSelect}
                    onSelectChange={onColorSelectChange}
                    customValue={colorCustom}
                    onCustomChange={onColorCustomChange}
                    placeholder="예: 연보라"
                />
                <OptionSelector
                    label="사이즈"
                    options={SIZE_OPTIONS}
                    selectedValue={sizeSelect}
                    onSelectChange={onSizeSelectChange}
                    customValue={sizeCustom}
                    onCustomChange={onSizeCustomChange}
                    placeholder="예: 아동 110"
                />
            </div>

            {/* 미리보기 및 추가 버튼 */}
            <div className="border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between w-full box-border" style={{ marginTop: '24px', paddingTop: '20px', gap: '16px' }}>
                <div className="flex items-center bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-[var(--border-color)] w-full sm:flex-1 shrink min-w-0" style={{ padding: '12px 16px', gap: '12px' }}>
                    <span className="text-sm font-semibold text-[var(--text-secondary)] shrink-0">미리보기 :</span>
                    <span className="text-base font-bold text-[var(--text-primary)] truncate" style={{ marginLeft: '12px' }}>{previewText}</span>
                </div>
                <button
                    onClick={onAdd}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-base font-bold rounded-xl hover:opacity-90 active:scale-95 transition-colors focus:outline-none flex justify-center items-center w-full sm:w-auto shrink-0"
                    style={{ height: '46px', padding: '0 24px', gap: '8px' }}
                >
                    <PlusIcon className="w-5 h-5 block" />
                    <span>옵션 추가</span>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: 재고 수정 모달
// ─────────────────────────────────────────────
interface EditModalProps {
    product: Product;
    skus: SkuItem[];
    price: number;
    name: string;
    isUpdating: boolean;
    colorSelect: string;
    sizeSelect: string;
    colorCustom: string;
    sizeCustom: string;
    onSkusChange: (skus: SkuItem[]) => void;
    onPriceChange: (price: number) => void;
    onNameChange: (name: string) => void;
    onColorSelectChange: (v: string) => void;
    onSizeSelectChange: (v: string) => void;
    onColorCustomChange: (v: string) => void;
    onSizeCustomChange: (v: string) => void;
    onAddSku: () => void;
    onRemoveSku: (index: number) => void;
    onSave: () => void;
    onClose: () => void;
}

function EditModal({
    product, skus, price, name, isUpdating,
    colorSelect, sizeSelect, colorCustom, sizeCustom,
    onSkusChange, onPriceChange, onNameChange,
    onColorSelectChange, onSizeSelectChange,
    onColorCustomChange, onSizeCustomChange,
    onAddSku, onRemoveSku, onSave, onClose,
}: EditModalProps) {
    const totalQty = calcTotalStock(skus);

    const handleQuantityChange = (idx: number, newValue: number) => {
        const updated = [...skus];
        updated[idx] = { ...updated[idx], quantity: newValue };
        onSkusChange(updated);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm box-border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 모달 윈도우 래퍼 */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full flex flex-col box-border overflow-hidden" style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', maxHeight: '90vh' }}>

                {/* 헤더 */}
                <header className="border-b border-[var(--border-color)] flex flex-wrap items-center justify-between bg-[var(--bg-card)] shrink-0 w-full box-border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '20px 24px', gap: '16px' }}>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex flex-wrap items-center min-w-0 flex-1" style={{ gap: '16px' }}>
                        <span className="truncate block" style={{ maxWidth: '400px' }}>{product.name}</span>
                        <span className="text-base sm:text-lg font-medium text-[var(--text-muted)] border-l-2 border-gray-300 dark:border-gray-700" style={{ paddingLeft: '16px' }}>
                            정보 및 재고 관리
                        </span>
                    </h2>
                    <button onClick={onClose} className="rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none shrink-0" aria-label="닫기" style={{ padding: '8px', marginRight: '-8px' }}>
                        <CloseIcon />
                    </button>
                </header>

                {/* 본문 (스크롤 영역) */}
                <main className="overflow-x-hidden overflow-y-auto w-full box-border bg-[var(--bg-card)]" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', overflowY: 'auto', padding: '24px' }}>
                    <div className="flex flex-col w-full box-border max-w-full" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                        {/* 1. 기본 정보 수정 */}
                        <section className="w-full">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]" style={{ marginBottom: '16px' }}>
                                기본 정보
                            </h3>
                            <div className="flex flex-col bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-color)] w-full box-border" style={{ padding: '20px 24px', gap: '20px' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center w-full" style={{ gap: '24px' }}>
                                    <label className="text-base font-semibold text-[var(--text-secondary)] shrink-0 md:mt-0 mt-1" style={{ width: '70px' }}>
                                        상품명
                                    </label>
                                    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500/20 transition-colors box-border flex-1" style={{ padding: '12px 16px', maxWidth: '100%' }}>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => onNameChange(e.target.value)}
                                            placeholder="상품명을 입력하세요"
                                            className="w-full text-left text-base font-bold bg-transparent outline-none text-[var(--text-primary)] min-w-0"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center w-full" style={{ gap: '24px' }}>
                                    <label className="text-base font-semibold text-[var(--text-secondary)] shrink-0 md:mt-0 mt-1" style={{ width: '70px' }}>
                                        가격
                                    </label>
                                    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500/20 transition-colors box-border" style={{ padding: '12px 16px', width: '240px', maxWidth: '100%' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={price}
                                            onChange={(e) => onPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full text-right text-base font-bold bg-transparent outline-none text-[var(--text-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                                        />
                                        <span className="text-base text-[var(--text-muted)] font-semibold shrink-0" style={{ marginLeft: '12px' }}>원</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-[var(--border-color)] opacity-50 m-0" />

                        {/* 2. 옵션(SKU) 재고 관리 */}
                        <section className="w-full">
                            <div className="flex flex-wrap items-center justify-between w-full" style={{ marginBottom: '20px', gap: '16px' }}>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] m-0">
                                    옵션 및 재고
                                </h3>
                                {skus.length > 0 && (
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-[var(--border-color)] shrink-0" style={{ padding: '6px 12px', gap: '8px' }}>
                                        <span className="text-sm font-semibold text-[var(--text-muted)]">총 수량</span>
                                        <span className="text-base font-bold text-[var(--text-primary)]">{totalQty} 개</span>
                                    </div>
                                )}
                            </div>

                            {skus.length === 0 ? (
                                <div className="text-base font-medium text-[var(--text-muted)] text-center bg-[var(--bg-elevated)] rounded-2xl border border-dashed border-[var(--border-color)] w-full" style={{ margin: '24px 0', padding: '40px 0' }}>
                                    등록된 옵션이 없습니다.<br />
                                    <span className="text-sm block opacity-80" style={{ marginTop: '8px' }}>아래 폼에서 새 옵션을 추가해주세요.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full" style={{ gap: '12px', marginBottom: '32px' }}>
                                    {skus.map((sku, idx) => (
                                        <SkuListItem
                                            key={`sku-${idx}`}
                                            sku={sku}
                                            onQuantityChange={(v) => handleQuantityChange(idx, v)}
                                            onRemove={() => onRemoveSku(idx)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 옵션 추가 폼 */}
                            <AddOptionForm
                                colorSelect={colorSelect}
                                sizeSelect={sizeSelect}
                                colorCustom={colorCustom}
                                sizeCustom={sizeCustom}
                                onColorSelectChange={onColorSelectChange}
                                onSizeSelectChange={onSizeSelectChange}
                                onColorCustomChange={onColorCustomChange}
                                onSizeCustomChange={onSizeCustomChange}
                                onAdd={onAddSku}
                            />
                        </section>
                    </div>
                </main>

                {/* 하단 푸터 영역 */}
                <footer className="border-t border-[var(--border-color)] flex flex-wrap justify-end items-center bg-[var(--bg-elevated)] shrink-0 w-full box-border" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', padding: '20px 24px', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        className="text-base font-semibold rounded-xl transition-colors focus:outline-none shrink-0"
                        style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                        취소
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isUpdating}
                        className="text-base font-bold rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 transition-colors focus:outline-none flex items-center justify-center shrink-0 min-w-[140px]"
                        style={{ padding: '12px 24px' }}
                    >
                        {isUpdating ? '저장 중...' : '저장하기'}
                    </button>
                </footer>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 하위 컴포넌트: 상품 테이블 행
// ─────────────────────────────────────────────
interface ProductRowProps {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
}

function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
    const skus = buildSkuList(product);
    const totalStock = calcTotalStock(skus);
    const isOutOfStock = totalStock === 0;
    const isLowStock = totalStock > 0 && totalStock < 5;

    return (
        <div
            className="inventory-product-row"
            style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr auto',
                alignItems: 'center',
                gap: '0',
                padding: '20px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
        >
            {/* 상품 정보 */}
            <div className="inventory-product-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '12px',
                    overflow: 'hidden', flexShrink: 0,
                    background: '#f3f4f6', border: '1px solid var(--border-color)',
                }}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            <ImagePlaceholderIcon />
                        </div>
                    )}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div className="inventory-product-name" style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{product.name}</div>
                    <div className="inventory-product-price" style={{ fontSize: '19px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{product.price?.toLocaleString() || 0}원</div>
                    <div className="inventory-product-id" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }} title={product.id}>
                        ID: {product.id.split('_')[1] || product.id}
                    </div>
                </div>
            </div>

            {/* 옵션별 재고 (SKU) */}
            <div className="inventory-sku-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                {skus.length > 0 ? (
                    skus.map((sku, i) => (
                        <div key={i} className="inventory-sku-item" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '18px', padding: '10px 16px', borderRadius: '8px',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '12px' }}>{sku.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ fontWeight: 700, color: sku.quantity < 3 ? '#ef4444' : 'var(--text-primary)' }}>
                                    {sku.quantity}개
                                </span>
                                {sku.quantity === 0 && (
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                                        background: '#374151', color: '#9ca3af', lineHeight: '16px',
                                    }}>품절</span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>옵션 없음</span>
                )}
            </div>

            {/* 총 재고 + 상태 배지 */}
            <div className="inventory-total-stock" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div className="inventory-total-stock-inner" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                    minWidth: '80px',
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>총 재고</span>
                    <span style={{
                        fontSize: '28px', fontWeight: 800,
                        color: isOutOfStock ? '#9ca3af' : isLowStock ? '#ef4444' : 'var(--text-primary)',
                        textDecoration: isOutOfStock ? 'line-through' : 'none',
                        lineHeight: 1,
                    }}>
                        {totalStock}개
                    </span>
                </div>
                {isOutOfStock && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '5px 14px', borderRadius: '20px', fontSize: '15px', fontWeight: 700,
                        background: '#374151', color: '#9ca3af',
                        border: '1px solid #4b5563',
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        품절
                    </span>
                )}
                {isLowStock && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '5px 14px', borderRadius: '20px', fontSize: '15px', fontWeight: 700,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                        품절 임박
                    </span>
                )}
            </div>

            {/* 관리 버튼 */}
            <div className="inventory-action-btns" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', paddingLeft: '20px' }}>
                <button
                    onClick={onEdit}
                    style={{
                        padding: '12px 24px', borderRadius: '10px', fontSize: '18px', fontWeight: 700,
                        background: 'var(--text-primary)', color: 'var(--bg-card)',
                        border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', width: '140px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                    재고 수정
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '10px 24px', borderRadius: '10px', fontSize: '16px', fontWeight: 600,
                        background: 'transparent', color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                        transition: 'all 0.2s', width: '140px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                    삭제
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────
export default function AdminInventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // 모달 상태
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editSkus, setEditSkus] = useState<SkuItem[]>([]);
    const [editPrice, setEditPrice] = useState(0);
    const [editName, setEditName] = useState('');
    const [newColorSelect, setNewColorSelect] = useState('선택');
    const [newSizeSelect, setNewSizeSelect] = useState('선택');
    const [newColorCustom, setNewColorCustom] = useState('');
    const [newSizeCustom, setNewSizeCustom] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // ── 데이터 조회 ──
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, image_url, colors, sizes, price, created_at')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Inventory fetch error:', error);
                toast.error('재고 목록을 불러오는데 실패했습니다.');
            } else {
                setProducts(data || []);
            }
        } catch (err) {
            console.error('Inventory fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // ── 삭제 (영구 삭제 - Cloudinary 리소스 포함) ──
    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 상품을 영구 삭제하시겠습니까?\n\nCloudinary 이미지/영상도 함께 삭제되며, 복구할 수 없습니다.')) return;
        try {
            const res = await fetch('/api/products?action=permanent', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            if (res.ok) {
                toast.success('상품이 영구 삭제되었습니다. (Cloudinary 리소스 포함)');
                fetchInventory();
            } else {
                toast.error('삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            toast.error('오류가 발생했습니다.');
        }
    };

    // ── 재고 수정 저장 ──
    const handleUpdateStock = async () => {
        if (!editingProduct) return;
        setIsUpdating(true);
        try {
            const mappedColors = editSkus.map(sku => ({ color: sku.name, quantity: sku.quantity }));
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, colors: mappedColors, sizes: [], price: editPrice }),
            });
            if (res.ok) {
                toast.success('재고가 수정되었습니다.');
                setEditingProduct(null);
                fetchInventory();
            } else {
                toast.error('재고 수정에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            toast.error('오류가 발생했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    // ── 모달 열기 ──
    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditSkus(buildSkuList(product));
        setEditPrice(product.price || 0);
        setEditName(product.name || '');
        setNewColorSelect('선택');
        setNewSizeSelect('선택');
        setNewColorCustom('');
        setNewSizeCustom('');
    };

    // ── SKU 추가 ──
    const handleAddSku = () => {
        const finalColor = newColorSelect === '직접 입력' ? newColorCustom.trim() : (newColorSelect === '선택' ? '' : newColorSelect);
        const finalSize = newSizeSelect === '직접 입력' ? newSizeCustom.trim() : (newSizeSelect === '선택' ? '' : newSizeSelect);

        if (!finalColor && !finalSize) {
            toast.error('색상 또는 사이즈를 선택/입력해주세요.');
            return;
        }

        const newSkuName = [finalColor, finalSize].filter(Boolean).join(' / ');
        if (editSkus.some(sku => sku.name.toLowerCase() === newSkuName.toLowerCase())) {
            toast.error('이미 존재하는 옵션입니다.');
            return;
        }

        setEditSkus(prev => [...prev, { name: newSkuName, quantity: 0 }]);

        // 사용성 개선: 색상은 유지하고 사이즈는 다음 사이즈로 자동 선택되어 연속 추가 편의성 증대
        const currentSizeIndex = SIZE_OPTIONS.indexOf(newSizeSelect);
        if (currentSizeIndex >= 1 && currentSizeIndex < SIZE_OPTIONS.length - 2) {
            setNewSizeSelect(SIZE_OPTIONS[currentSizeIndex + 1]);
        } else {
            setNewSizeSelect('선택');
            setNewSizeCustom('');
        }
    };

    // ── SKU 삭제 ──
    const handleRemoveSku = (index: number) => {
        if (!confirm('이 옵션을 삭제하시겠습니까?')) return;
        setEditSkus(prev => prev.filter((_, i) => i !== index));
    };

    // ── 렌더링 ──
    return (
        <div className="section-padding min-h-screen pb-[120px] bg-[var(--bg-elevated)]">
            <div className="container-main max-w-[1200px]">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 style={{ fontSize: '33px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>재고 관리</h1>
                    <button
                        onClick={fetchInventory}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', fontSize: '20px', fontWeight: 600, borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                        <RefreshIcon />
                        새로고침
                    </button>
                </div>

                {/* 테이블 */}
                <div>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '80px 20px',
                            background: 'var(--bg-card)', borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                        }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>등록된 상품이 없습니다.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* 테이블 헤더 */}
                            <div
                                className="inventory-table-header"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 2fr 1fr auto',
                                    padding: '12px 24px',
                                    gap: '0',
                                }}>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>상품 정보</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션별 재고</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>총 재고</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', paddingLeft: '20px', width: '140px' }}>관리</span>
                            </div>
                            {/* 상품 카드 리스트 */}
                            {products.map(product => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onEdit={() => openEditModal(product)}
                                    onDelete={() => handleDelete(product.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 재고 수정 모달 */}
            {editingProduct && (
                <EditModal
                    product={editingProduct}
                    skus={editSkus}
                    price={editPrice}
                    name={editName}
                    isUpdating={isUpdating}
                    colorSelect={newColorSelect}
                    sizeSelect={newSizeSelect}
                    colorCustom={newColorCustom}
                    sizeCustom={newSizeCustom}
                    onSkusChange={setEditSkus}
                    onPriceChange={setEditPrice}
                    onNameChange={setEditName}
                    onColorSelectChange={setNewColorSelect}
                    onSizeSelectChange={setNewSizeSelect}
                    onColorCustomChange={setNewColorCustom}
                    onSizeCustomChange={setNewSizeCustom}
                    onAddSku={handleAddSku}
                    onRemoveSku={handleRemoveSku}
                    onSave={handleUpdateStock}
                    onClose={() => setEditingProduct(null)}
                />
            )}

            {/* 모바일 반응형 스타일 */}
            <style jsx global>{`
                @media (max-width: 767px) {
                    .inventory-table-header {
                        display: none !important;
                    }
                    .inventory-product-row {
                        grid-template-columns: 1fr !important;
                        gap: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    /* 상품 정보 영역 */
                    .inventory-product-info {
                        padding: 16px !important;
                        gap: 12px !important;
                        border-bottom: 1px solid var(--border-color) !important;
                    }
                    .inventory-product-name {
                        font-size: 16px !important;
                    }
                    .inventory-product-price {
                        font-size: 15px !important;
                    }
                    .inventory-product-id {
                        font-size: 12px !important;
                        max-width: 180px !important;
                    }
                    /* 옵션별 재고 */
                    .inventory-sku-list {
                        padding: 12px 16px !important;
                        min-width: 0 !important;
                        gap: 6px !important;
                        border-bottom: 1px solid var(--border-color) !important;
                    }
                    .inventory-sku-item {
                        font-size: 14px !important;
                        padding: 8px 12px !important;
                    }
                    /* 총 재고 */
                    .inventory-total-stock {
                        padding: 12px 16px !important;
                        align-items: stretch !important;
                        border-bottom: 1px solid var(--border-color) !important;
                    }
                    .inventory-total-stock-inner {
                        flex-direction: row !important;
                        justify-content: space-between !important;
                        padding: 10px 14px !important;
                    }
                    /* 관리 버튼 */
                    .inventory-action-btns {
                        flex-direction: row !important;
                        padding: 12px 16px !important;
                        padding-left: 16px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        gap: 8px !important;
                    }
                    .inventory-action-btns button {
                        flex: 1 !important;
                        width: auto !important;
                        font-size: 14px !important;
                        padding: 10px 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
