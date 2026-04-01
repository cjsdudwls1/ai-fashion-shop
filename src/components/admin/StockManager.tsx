'use client';

import type { StockItem } from '@/types/adminTypes';
import { COMMON_COLORS, COMMON_SIZES } from '@/lib/constants';

interface StockManagerProps {
    stockList: StockItem[];
    selectedColor: string | null;
    selectedSize: string | null;
    quantity: number | string;
    setSelectedColor: (color: string) => void;
    setSelectedSize: (size: string) => void;
    setQuantity: (qty: number | string) => void;
    handleAddStock: () => void;
    handleRemoveStock: (id: number) => void;
}

/**
 * 색상/사이즈 재고 CRUD 컴포넌트
 */
export default function StockManager({
    stockList,
    selectedColor,
    selectedSize,
    quantity,
    setSelectedColor,
    setSelectedSize,
    setQuantity,
    handleAddStock,
    handleRemoveStock,
}: StockManagerProps) {
    return (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>재고 (Stock)</h3>
                <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{stockList.length}개 옵션 추가됨</span>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 색상 선택 */}
                    <div>
                        <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 1: 색상 (Color)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {COMMON_COLORS.map(c => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setSelectedColor(c.name)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 12px', borderRadius: '30px',
                                        border: selectedColor === c.name ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                        background: selectedColor === c.name ? 'var(--bg-card)' : 'transparent',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                                    <span style={{ fontSize: '16px', fontWeight: selectedColor === c.name ? 600 : 400 }}>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 사이즈 선택 */}
                    <div>
                        <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 2: 사이즈 (Size)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {COMMON_SIZES.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSelectedSize(s)}
                                    style={{
                                        padding: '8px 16px', fontSize: '16px', fontWeight: selectedSize === s ? 600 : 400,
                                        background: selectedSize === s ? 'var(--text-primary)' : 'transparent',
                                        color: selectedSize === s ? 'var(--bg-card)' : 'var(--text-primary)',
                                        border: selectedSize === s ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 수량 입력 + 추가 버튼 */}
                    <div className="admin-qty-add-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', marginTop: '8px' }}>
                        <div style={{ width: '120px' }}>
                            <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>수량 (Quantity)</label>
                            <input
                                type="number" min="1" value={quantity}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') setQuantity('');
                                    else setQuantity(parseInt(val));
                                }}
                                style={{
                                    width: '100%', padding: '10px', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', background: 'var(--bg-card)', fontSize: '18px',
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddStock}
                            disabled={!selectedColor || !selectedSize}
                            className="btn-primary"
                            style={{
                                padding: '12px 24px', fontSize: '18px', height: '46px', borderRadius: '8px',
                                opacity: (!selectedColor || !selectedSize) ? 0.5 : 1,
                            }}
                        >
                            옵션 추가
                        </button>
                    </div>

                </div>
            </div>

            {/* 재고 목록 테이블 */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '18px', minWidth: '500px' }}>
                    <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>옵션명</th>
                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>재고 수량</th>
                            <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockList.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    추가된 옵션이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            stockList.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: COMMON_COLORS.find(c => c.name === item.color)?.hex, border: '1px solid var(--border-color)' }} />
                                            <span style={{ fontWeight: 500 }}>{item.color} <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>/</span> {item.size}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>{item.quantity}개</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleRemoveStock(item.id)}
                                            style={{
                                                color: '#ef4444', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                                                cursor: 'pointer', fontSize: '16px', padding: '8px 14px', borderRadius: '6px',
                                            }}
                                            className="hover:bg-red-50 hover:border-red-500 transition-all"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
