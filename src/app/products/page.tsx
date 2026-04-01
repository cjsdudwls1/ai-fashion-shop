'use client';

import { VideoModal } from '@/components/VideoModal';
import { ProductCardSkeleton } from '@/components/ProductSkeleton';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Trash2, LayoutGrid, RefreshCw, Edit3, Check, Package } from 'lucide-react';

export default function ProductsPage() {
    const {
        products,
        loading,
        filteredProducts,
        selectedCategory,
        setSelectedCategory,
        availableCategories,
        getCategoryDisplayName,
        viewMode,
        setViewMode,
        isEditMode,
        setIsEditMode,
        selectedToDelete,
        toggleSelectProduct,
        setSelectedToDelete,
        handleDeleteProducts,
        handleRestoreProducts,
        selectedProduct,
        handleVideoPlay,
        setSelectedProduct,
        isAdmin,
    } = useProducts();

    return (
        <div className="section-padding">
            <div className="container-main">
                {/* 헤더 */}
                <div style={{ marginBottom: '48px' }}>

                    {/* 관리자 컨트롤 */}
                    {isAdmin && (
                        <div className="products-header-controls" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            {/* 좌측: 뷰 전환 */}
                            <button
                                onClick={() => {
                                    setViewMode(viewMode === 'gallery' ? 'trash' : 'gallery');
                                    setSelectedCategory('all');
                                    setIsEditMode(false);
                                    setSelectedToDelete([]);
                                }}
                                className="glass-card"
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    color: viewMode === 'trash' ? '#ef4444' : 'var(--text-secondary)',
                                    minHeight: '36px',
                                }}
                            >
                                {viewMode === 'gallery' ? (
                                    <><Trash2 size={16} /> 휴지통 보기</>
                                ) : (
                                    <><LayoutGrid size={16} /> 갤러리 보기</>
                                )}
                            </button>

                            {/* 우측: 편집/삭제/복구 */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {viewMode === 'trash' && selectedToDelete.length > 0 && (
                                    <button
                                        onClick={handleRestoreProducts}
                                        className="badge badge-success"
                                        style={{
                                            border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '12px',
                                            display: 'flex', alignItems: 'center', gap: '4px', minHeight: '36px',
                                        }}
                                    >
                                        <RefreshCw size={14} />
                                        복구 ({selectedToDelete.length})
                                    </button>
                                )}

                                {(isEditMode || viewMode === 'trash') && selectedToDelete.length > 0 && (
                                    <button
                                        onClick={handleDeleteProducts}
                                        className="badge badge-primary"
                                        style={{
                                            border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '12px',
                                            background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '36px',
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        {viewMode === 'trash' ? `영구 삭제 (${selectedToDelete.length})` : `삭제 (${selectedToDelete.length})`}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setIsEditMode(!isEditMode);
                                        setSelectedToDelete([]);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        color: (isEditMode || viewMode === 'trash') ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        transition: 'all 0.2s',
                                        minWidth: '36px',
                                        minHeight: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title={isEditMode ? '편집 종료' : '편집 모드'}
                                >
                                    {isEditMode ? <Check size={20} /> : <Edit3 size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 제목 (Editorial Style) */}
                    <div className="text-center mb-12">
                        <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-4">
                            {viewMode === 'trash' ? 'Trash' : 'The Collection'}
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] tracking-wider uppercase">
                            {viewMode === 'trash'
                                ? 'Deleted items will be permanently removed after 1 day.'
                                : 'Curated pieces powered by AI fitting technology'}
                        </p>
                    </div>

                    {/* 카테고리 필터 바 (Minimal Tab Style) */}
                    <div className="w-full border-b border-[var(--border-color)] mb-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center justify-center min-w-max md:min-w-0 gap-8 pb-3">
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat || 'all')}
                                    className={`relative text-xs font-semibold tracking-widest uppercase py-2 transition-colors ${
                                        selectedCategory === cat
                                            ? 'text-[var(--text-primary)]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {cat === 'all' ? 'ALL' : (cat ? getCategoryDisplayName(cat) : '')}
                                    {selectedCategory === cat && (
                                        <div className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[var(--text-primary)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 제품 그리드 */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {filteredProducts.map(product => (
                            <div key={product.id} style={{ position: 'relative' }}>
                                {(isEditMode || viewMode === 'trash') && (
                                    <div
                                        onClick={() => toggleSelectProduct(product.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '0', left: '0', right: '0', bottom: '0',
                                            zIndex: 10,
                                            cursor: 'pointer'
                                        }}
                                    />
                                )}
                                <ProductCard
                                    product={product}
                                    onVideoPlay={(p) => {
                                        if (isEditMode || viewMode === 'trash') {
                                            toggleSelectProduct(p.id);
                                        } else {
                                            handleVideoPlay(p);
                                        }
                                    }}
                                />
                                {(isEditMode || viewMode === 'trash') && (
                                    <div
                                        onClick={() => toggleSelectProduct(product.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            zIndex: 20,
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: selectedToDelete.includes(product.id) ? '#8b5cf6' : 'rgba(0,0,0,0.5)',
                                            border: '2px solid white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {selectedToDelete.includes(product.id) && (
                                            <Check size={16} color="white" strokeWidth={3} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* 빈 상태 */
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{
                            width: '96px',
                            height: '96px',
                            margin: '0 auto 24px',
                            borderRadius: '50%',
                            background: 'rgba(139, 92, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Package size={48} color="#a78bfa" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>아직 등록된 제품이 없습니다</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            {isAdmin ? '관리자 페이지에서 첫 번째 제품을 등록해보세요.' : '곧 새로운 제품이 등록될 예정입니다.'}
                        </p>
                        {isAdmin && (
                            <a href="/admin" className="btn-primary">
                                제품 등록하기
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* 비디오 모달 */}
            <VideoModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
}
