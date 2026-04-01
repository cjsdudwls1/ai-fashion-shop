'use client';

import { Product } from '@/lib/types';

interface ProductOptionsProps {
    product: Product;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    selectedSize: string;
    setSelectedSize: (size: string) => void;
    quantity: number;
    setQuantity: (quantity: number) => void;
    maxStock: number;
}

export function ProductOptions({
    product,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    quantity,
    setQuantity,
    maxStock,
}: ProductOptionsProps) {
    return (
        <div className="space-y-8">
            {/* 색상/옵션 선택 */}
            {product.colors.length > 0 && (
                <div>
                    <div className="flex justify-between mb-4">
                        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)]">
                            {product.sizes.length === 0 ? 'OPTION' : 'COLOR'}
                        </span>
                        <span className="text-[11px] tracking-widest uppercase text-[var(--text-secondary)]">{selectedColor}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {product.colors.map((c) => (
                            <button
                                key={c.color}
                                onClick={() => setSelectedColor(c.color)}
                                disabled={c.quantity <= 0}
                                className={`
                                    min-w-[80px] px-4 py-3 border text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300
                                    ${selectedColor === c.color
                                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-dark)] shadow-md'
                                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'}
                                    ${c.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'}
                                `}
                            >
                                {c.color}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 사이즈 선택 */}
            {product.sizes.length > 0 && (
                <div>
                    <div className="flex justify-between mb-4">
                        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)]">SIZE</span>
                        <span className="text-[11px] tracking-widest text-[var(--text-secondary)] uppercase">{selectedSize}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {product.sizes.map((s) => (
                            <button
                                key={s.size}
                                onClick={() => setSelectedSize(s.size)}
                                disabled={s.quantity <= 0}
                                className={`
                                    py-3 border text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 relative overflow-hidden
                                    ${selectedSize === s.size
                                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-dark)] shadow-md'
                                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'}
                                    ${s.quantity <= 0 ? 'opacity-40 cursor-not-allowed bg-[var(--bg-elevated)]' : 'active:scale-[0.98]'}
                                `}
                            >
                                {s.size}
                                {s.quantity <= 0 && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                                        <div className="absolute w-[120%] h-[1px] bg-black/40 rotate-12" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 수량 선택 */}
            <div className="w-32">
                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)] mb-4">QUANTITY</label>
                <div className="flex items-center border border-[var(--border-color)]">
                    <button
                        className="w-12 h-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                    >
                        -
                    </button>
                    <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="w-12 text-center text-[13px] font-medium outline-none bg-transparent text-[var(--text-primary)]"
                    />
                    <button
                        className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                        disabled={quantity >= maxStock}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
