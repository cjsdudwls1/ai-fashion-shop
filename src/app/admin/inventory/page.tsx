'use client';

import { useInventory } from '@/hooks/useInventory';
import type { InventoryProduct, SkuItem, EditState, EditActions } from '@/hooks/useInventory';
import { buildSkuList, calcTotalStock, COLOR_OPTIONS, SIZE_OPTIONS } from '@/hooks/useInventory';
import { RefreshCw, X, Plus, Trash2, ImageIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import './inventory.css';

// ─── QuantityControl ───
function QuantityControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const btnClass = 'w-12 h-12 flex items-center justify-center text-lg font-medium bg-gray-50 hover:bg-gray-200 text-gray-700 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] dark:text-gray-300 transition-colors focus:outline-none';
    return (
        <div className="flex items-center rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shrink-0">
            <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className={btnClass}>-</button>
            <input type="number" min="0" value={value} onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-12 text-center text-base font-medium border-x border-[var(--border-color)] bg-transparent focus:outline-none text-[var(--text-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <button type="button" onClick={() => onChange(value + 1)} className={btnClass}>+</button>
        </div>
    );
}

// ─── SkuListItem ───
function SkuListItem({ sku, onQuantityChange, onRemove }: { sku: SkuItem; onQuantityChange: (v: number) => void; onRemove: () => void }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0 group gap-4">
            <div className="flex-1 min-w-0 pr-4">
                <span className="font-medium text-lg text-[var(--text-primary)] tracking-wide truncate block">{sku.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <QuantityControl value={sku.quantity} onChange={onQuantityChange} />
                <button onClick={onRemove} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-red-500 rounded-lg transition-colors focus:outline-none" title="옵션 삭제">
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}

// ─── OptionSelector ───
function OptionSelector({ label, options, selectedValue, onSelectChange, customValue, onCustomChange, placeholder }: {
    label: string; options: string[]; selectedValue: string; onSelectChange: (v: string) => void;
    customValue: string; onCustomChange: (v: string) => void; placeholder: string;
}) {
    const selectClass = 'w-full sm:w-52 px-5 py-3 text-base font-medium border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20 text-[var(--text-primary)] cursor-pointer transition-all shrink-0';
    const inputClass = 'w-full sm:flex-1 min-w-[120px] px-5 py-3 text-base font-medium border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500/20 text-[var(--text-primary)] transition-all shrink';
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
            <span className="text-base font-semibold sm:w-16 text-[var(--text-secondary)] pl-1 shrink-0">{label}</span>
            <div className="flex flex-col sm:flex-row gap-2 flex-1 relative w-full overflow-hidden">
                <select value={selectedValue} onChange={(e) => { onSelectChange(e.target.value); if (e.target.value !== '직접 입력') onCustomChange(''); }} className={selectClass}>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {selectedValue === '직접 입력' && (
                    <input type="text" value={customValue} onChange={(e) => onCustomChange(e.target.value)} placeholder={placeholder} className={inputClass} />
                )}
            </div>
        </div>
    );
}

// ─── AddOptionForm ───
function AddOptionForm({ editState, editActions }: { editState: EditState; editActions: EditActions }) {
    const previewColor = editState.colorSelect === '직접 입력' ? editState.colorCustom.trim() : (editState.colorSelect === '선택' ? '' : editState.colorSelect);
    const previewSize = editState.sizeSelect === '직접 입력' ? editState.sizeCustom.trim() : (editState.sizeSelect === '선택' ? '' : editState.sizeSelect);
    const previewText = [previewColor, previewSize].filter(Boolean).join(' / ') || '선택 없음';

    return (
        <div className="p-6 sm:p-8 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl relative overflow-hidden mt-6">
            <h4 className="text-xl font-bold text-[var(--text-primary)] mb-6">새로운 옵션 추가</h4>
            <div className="flex flex-col gap-6 w-full">
                <OptionSelector label="색상" options={COLOR_OPTIONS} selectedValue={editState.colorSelect} onSelectChange={editActions.setColorSelect} customValue={editState.colorCustom} onCustomChange={editActions.setColorCustom} placeholder="예: 연보라" />
                <OptionSelector label="사이즈" options={SIZE_OPTIONS} selectedValue={editState.sizeSelect} onSelectChange={editActions.setSizeSelect} customValue={editState.sizeCustom} onCustomChange={editActions.setSizeCustom} placeholder="예: 아동 110" />
            </div>
            <div className="border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between w-full box-border" style={{ marginTop: '24px', paddingTop: '20px', gap: '16px' }}>
                <div className="flex items-center bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-[var(--border-color)] w-full sm:flex-1 shrink min-w-0" style={{ padding: '12px 16px', gap: '12px' }}>
                    <span className="text-sm font-semibold text-[var(--text-secondary)] shrink-0">미리보기 :</span>
                    <span className="text-base font-bold text-[var(--text-primary)] truncate" style={{ marginLeft: '12px' }}>{previewText}</span>
                </div>
                <button onClick={editActions.addSku} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-base font-bold rounded-xl hover:opacity-90 active:scale-95 transition-colors focus:outline-none flex justify-center items-center w-full sm:w-auto shrink-0" style={{ height: '46px', padding: '0 24px', gap: '8px' }}>
                    <Plus size={20} />
                    <span>옵션 추가</span>
                </button>
            </div>
        </div>
    );
}

// ─── EditModal ───
function EditModal({ product, editState, editActions, isUpdating, onSave, onClose }: {
    product: InventoryProduct; editState: EditState; editActions: EditActions; isUpdating: boolean; onSave: () => void; onClose: () => void;
}) {
    const totalQty = calcTotalStock(editState.skus);
    const handleQuantityChange = (idx: number, newValue: number) => {
        const updated = [...editState.skus];
        updated[idx] = { ...updated[idx], quantity: newValue };
        editActions.setSkus(updated);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm box-border">
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full flex flex-col box-border overflow-hidden" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                {/* 헤더 */}
                <header className="border-b border-[var(--border-color)] flex flex-wrap items-center justify-between bg-[var(--bg-card)] shrink-0 w-full box-border" style={{ padding: '20px 24px', gap: '16px' }}>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex flex-wrap items-center min-w-0 flex-1" style={{ gap: '16px' }}>
                        <span className="truncate block" style={{ maxWidth: '400px' }}>{product.name}</span>
                        <span className="text-base sm:text-lg font-medium text-[var(--text-muted)] border-l-2 border-gray-300 dark:border-gray-700" style={{ paddingLeft: '16px' }}>정보 및 재고 관리</span>
                    </h2>
                    <button onClick={onClose} className="rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none shrink-0" aria-label="닫기" style={{ padding: '8px', marginRight: '-8px' }}>
                        <X size={24} />
                    </button>
                </header>

                {/* 본문 */}
                <main className="overflow-x-hidden overflow-y-auto w-full box-border bg-[var(--bg-card)]" style={{ flex: '1 1 0%', overflowY: 'auto', padding: '24px' }}>
                    <div className="flex flex-col w-full box-border max-w-full" style={{ gap: '40px' }}>
                        {/* 기본 정보 */}
                        <section className="w-full">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]" style={{ marginBottom: '16px' }}>기본 정보</h3>
                            <div className="flex flex-col bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-color)] w-full box-border" style={{ padding: '20px 24px', gap: '20px' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center w-full" style={{ gap: '24px' }}>
                                    <label className="text-base font-semibold text-[var(--text-secondary)] shrink-0 md:mt-0 mt-1" style={{ width: '70px' }}>상품명</label>
                                    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500/20 transition-colors box-border flex-1" style={{ padding: '12px 16px', maxWidth: '100%' }}>
                                        <input type="text" value={editState.name} onChange={(e) => editActions.setName(e.target.value)} placeholder="상품명을 입력하세요" className="w-full text-left text-base font-bold bg-transparent outline-none text-[var(--text-primary)] min-w-0" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center w-full" style={{ gap: '24px' }}>
                                    <label className="text-base font-semibold text-[var(--text-secondary)] shrink-0 md:mt-0 mt-1" style={{ width: '70px' }}>가격</label>
                                    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500/20 transition-colors box-border" style={{ padding: '12px 16px', width: '240px', maxWidth: '100%' }}>
                                        <input type="number" min="0" value={editState.price} onChange={(e) => editActions.setPrice(Math.max(0, parseInt(e.target.value) || 0))} className="w-full text-right text-base font-bold bg-transparent outline-none text-[var(--text-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0" />
                                        <span className="text-base text-[var(--text-muted)] font-semibold shrink-0" style={{ marginLeft: '12px' }}>원</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-[var(--border-color)] opacity-50 m-0" />

                        {/* 옵션 및 재고 */}
                        <section className="w-full">
                            <div className="flex flex-wrap items-center justify-between w-full" style={{ marginBottom: '20px', gap: '16px' }}>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] m-0">옵션 및 재고</h3>
                                {editState.skus.length > 0 && (
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-[var(--border-color)] shrink-0" style={{ padding: '6px 12px', gap: '8px' }}>
                                        <span className="text-sm font-semibold text-[var(--text-muted)]">총 수량</span>
                                        <span className="text-base font-bold text-[var(--text-primary)]">{totalQty} 개</span>
                                    </div>
                                )}
                            </div>

                            {editState.skus.length === 0 ? (
                                <div className="text-base font-medium text-[var(--text-muted)] text-center bg-[var(--bg-elevated)] rounded-2xl border border-dashed border-[var(--border-color)] w-full" style={{ margin: '24px 0', padding: '40px 0' }}>
                                    등록된 옵션이 없습니다.<br />
                                    <span className="text-sm block opacity-80" style={{ marginTop: '8px' }}>아래 폼에서 새 옵션을 추가해주세요.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full" style={{ gap: '12px', marginBottom: '32px' }}>
                                    {editState.skus.map((sku, idx) => (
                                        <SkuListItem key={`sku-${idx}`} sku={sku} onQuantityChange={(v) => handleQuantityChange(idx, v)} onRemove={() => editActions.removeSku(idx)} />
                                    ))}
                                </div>
                            )}

                            <AddOptionForm editState={editState} editActions={editActions} />
                        </section>
                    </div>
                </main>

                {/* 푸터 */}
                <footer className="border-t border-[var(--border-color)] flex flex-wrap justify-end items-center bg-[var(--bg-elevated)] shrink-0 w-full box-border" style={{ padding: '20px 24px', gap: '16px' }}>
                    <button onClick={onClose} className="text-base font-semibold rounded-xl transition-colors focus:outline-none shrink-0" style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>취소</button>
                    <button onClick={onSave} disabled={isUpdating} className="text-base font-bold rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 transition-colors focus:outline-none flex items-center justify-center shrink-0 min-w-[140px]" style={{ padding: '12px 24px' }}>
                        {isUpdating ? '저장 중...' : '저장하기'}
                    </button>
                </footer>
            </div>
        </div>
    );
}

// ─── ProductRow ───
function ProductRow({ product, onEdit, onDelete }: { product: InventoryProduct; onEdit: () => void; onDelete: () => void }) {
    const skus = buildSkuList(product);
    const totalStock = calcTotalStock(skus);
    const isOutOfStock = totalStock === 0;
    const isLowStock = totalStock > 0 && totalStock < 5;

    return (
        <div className="inventory-product-row" style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', alignItems: 'center', gap: '0',
            padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
            {/* 상품 정보 */}
            <div className="inventory-product-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', border: '1px solid var(--border-color)' }}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            <ImageIcon size={24} />
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

            {/* SKU */}
            <div className="inventory-sku-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                {skus.length > 0 ? skus.map((sku, i) => (
                    <div key={i} className="inventory-sku-item" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px',
                        padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '12px' }}>{sku.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontWeight: 700, color: sku.quantity < 3 ? '#ef4444' : 'var(--text-primary)' }}>{sku.quantity}개</span>
                            {sku.quantity === 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#374151', color: '#9ca3af', lineHeight: '16px' }}>품절</span>
                            )}
                        </div>
                    </div>
                )) : (
                    <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>옵션 없음</span>
                )}
            </div>

            {/* 총 재고 */}
            <div className="inventory-total-stock" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div className="inventory-total-stock-inner" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', minWidth: '80px',
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>총 재고</span>
                    <span style={{
                        fontSize: '28px', fontWeight: 800,
                        color: isOutOfStock ? '#9ca3af' : isLowStock ? '#ef4444' : 'var(--text-primary)',
                        textDecoration: isOutOfStock ? 'line-through' : 'none', lineHeight: 1,
                    }}>{totalStock}개</span>
                </div>
                {isOutOfStock && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 14px', borderRadius: '20px', fontSize: '15px', fontWeight: 700, background: '#374151', color: '#9ca3af', border: '1px solid #4b5563' }}>
                        <CheckCircle size={12} /> 품절
                    </span>
                )}
                {isLowStock && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 14px', borderRadius: '20px', fontSize: '15px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <AlertTriangle size={12} /> 품절 임박
                    </span>
                )}
            </div>

            {/* 관리 버튼 */}
            <div className="inventory-action-btns" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', paddingLeft: '20px' }}>
                <button onClick={onEdit} className="inventory-edit-btn" style={{
                    padding: '12px 24px', borderRadius: '10px', fontSize: '18px', fontWeight: 700,
                    background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', width: '140px',
                }}>재고 수정</button>
                <button onClick={onDelete} className="inventory-delete-btn" style={{
                    padding: '10px 24px', borderRadius: '10px', fontSize: '16px', fontWeight: 600,
                    background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', width: '140px',
                }}>삭제</button>
            </div>
        </div>
    );
}

// ─── 메인 페이지 ───
export default function AdminInventoryPage() {
    const {
        products, loading, fetchInventory,
        editingProduct, openEditModal, closeEditModal,
        editState, editActions,
        handleDelete, handleUpdateStock, isUpdating,
    } = useInventory();

    return (
        <div className="section-padding min-h-screen pb-[120px] bg-[var(--bg-elevated)]">
            <div className="container-main max-w-[1200px]">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 style={{ fontSize: '33px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>재고 관리</h1>
                    <button onClick={fetchInventory} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', fontSize: '20px', fontWeight: 600, borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <RefreshCw size={16} /> 새로고침
                    </button>
                </div>

                {/* 테이블 */}
                <div>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>등록된 상품이 없습니다.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="inventory-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', padding: '12px 24px', gap: '0' }}>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>상품 정보</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션별 재고</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>총 재고</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', paddingLeft: '20px', width: '140px' }}>관리</span>
                            </div>
                            {products.map(product => (
                                <ProductRow key={product.id} product={product} onEdit={() => openEditModal(product)} onDelete={() => handleDelete(product.id)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 모달 */}
            {editingProduct && (
                <EditModal product={editingProduct} editState={editState} editActions={editActions} isUpdating={isUpdating} onSave={handleUpdateStock} onClose={closeEditModal} />
            )}
        </div>
    );
}
