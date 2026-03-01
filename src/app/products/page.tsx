'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { VideoModal } from '@/components/VideoModal';
import { toast } from 'react-hot-toast';
import { ProductCardSkeleton } from '@/components/ProductSkeleton';
import { useRouter } from 'next/navigation';
import { CATEGORY_MAP } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
// 제품 카드 컴포넌트
function ProductCard({ product, onVideoPlay }: { product: Product; onVideoPlay: (product: Product) => void }) {
    const router = useRouter();
    const totalColorStock = product.colors.reduce((sum: number, c: any) => sum + c.quantity, 0);
    const totalSizeStock = product.sizes.reduce((sum: number, s: any) => sum + s.quantity, 0);

    const [selectedColor, setSelectedColor] = useState<string>(product.colors.length > 0 ? product.colors[0].color : '');
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes.length > 0 ? product.sizes[0].size : '');

    // Stop propagation for control elements
    const handleControlClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <Link
            href={`/products/${product.id}`}
            className="glass-card group"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'block', position: 'relative' }}
        >
            {/* 제품 이미지 */}
            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="product-image"
                    style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
                />

                {/* 품절 오버레이 */}
                {totalColorStock === 0 && totalSizeStock === 0 && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                        <span className="text-white font-bold text-lg tracking-widest border-2 border-white px-4 py-2">
                            SOLD OUT
                        </span>
                    </div>
                )}

                {/* 영상 오버레이 (생성중/실패 상태 등) */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: (product.videoStatus === 'generating' || product.videoStatus === 'failed') ? 1 : 0,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none' // 클릭 이벤트가 아래로 전달되도록 설정
                }} className="card-overlay">
                    {product.videoStatus === 'generating' ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <div className="spinner" />
                            <span style={{ color: 'white', fontSize: '14px' }}>영상 생성 중...</span>
                        </div>
                    ) : product.videoStatus === 'failed' ? (
                        <div
                            title={product.videoErrorReason || '알 수 없는 오류'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '9999px',
                                background: 'rgba(239, 68, 68, 0.9)', // Red background
                                backdropFilter: 'blur(8px)',
                                cursor: 'help'
                            }}
                        >
                            <svg style={{ width: '20px', height: '20px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                영상 생성 실패
                                {product.videoErrorReason && (
                                    <span style={{ fontSize: '11px', display: 'block', fontWeight: '400', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {product.videoErrorReason.includes('pixel') ? '이미지 포맷 오류' : product.videoErrorReason}
                                    </span>
                                )}
                            </span>
                        </div>
                    ) : null}
                </div>


            </div>

            {/* 제품 정보 */}
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: 0, cursor: 'pointer' }} className="hover:text-indigo-600 transition-colors">
                            {product.name}
                        </h3>
                    </div>
                    {product.videoStatus === 'generating' && (
                        <span className="badge badge-warning animate-pulse" style={{ fontSize: '11px', flexShrink: 0 }}>AI 피팅모델 생성중</span>
                    )}
                    {product.videoStatus === 'completed' && product.videoUrl && (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}>
                            <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            영상 있음
                        </span>
                    )}
                    {product.videoStatus === 'completed' && !product.videoUrl && product.tryOnImageUrl && (
                        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}>
                            피팅 이미지
                        </span>
                    )}
                    {product.videoStatus === 'pending' && (
                        <span className="badge badge-info" style={{ fontSize: '11px', flexShrink: 0 }}>대기 중</span>
                    )}
                    {product.videoStatus === 'failed' && (
                        <span
                            className="badge badge-primary"
                            title={product.videoErrorReason || '알 수 없는 오류'}
                            style={{
                                fontSize: '11px',
                                flexShrink: 0,
                                backgroundColor: '#ef4444',
                                color: 'white',
                                cursor: 'help'
                            }}
                        >
                            실패: {product.videoErrorReason ? (product.videoErrorReason.length > 10 ? product.videoErrorReason.substring(0, 10) + '...' : product.videoErrorReason) : '오류'}
                        </span>
                    )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    {product.fabric}
                </p>

                {/* 색상 선택 */}
                {product.colors.length > 0 && (
                    <div style={{ marginBottom: '12px' }} onClick={handleControlClick}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>색상</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {product.colors.map((color: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedColor(color.color);
                                    }}
                                    className={`badge ${selectedColor === color.color ? 'badge-primary' : 'bg-gray-200 text-gray-500'}`}
                                    style={{ fontSize: '11px', border: selectedColor === color.color ? 'none' : '1px solid #e5e7eb' }}
                                    disabled={color.quantity <= 0}
                                >
                                    {color.color} ({color.quantity})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 사이즈 선택 */}
                {product.sizes.length > 0 && (
                    <div onClick={handleControlClick}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>사이즈</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {product.sizes.map((size: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedSize(size.size);
                                    }}
                                    className={`badge ${selectedSize === size.size ? 'badge-info' : 'bg-gray-200 text-gray-500'}`}
                                    style={{ fontSize: '11px', border: selectedSize === size.size ? 'none' : '1px solid #e5e7eb' }}
                                    disabled={size.quantity <= 0}
                                >
                                    {size.size} ({size.quantity})
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>




            <style jsx>{`
        .glass-card:hover .card-overlay {
          opacity: 1 !important;
        }
        .glass-card:hover .product-image {
          transform: scale(1.1);
        }
      `}</style>
        </Link >
    );
}



// 로딩 스켈레톤 (Removed local definition, using imported ProductCardSkeleton)

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 카테고리 필터
    const [viewMode, setViewMode] = useState<'gallery' | 'trash'>('gallery'); // 보기 모드
    const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부

    // 관리자 권한 확인
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setIsAdmin(data?.role === 'admin');
            }
        };
        checkAdmin();
    }, []);

    // 제품 목록 가져오기
    const fetchProducts = useCallback(async () => {
        try {
            const endpoint = `/api/products?t=${Date.now()}&status=${viewMode === 'trash' ? 'trash' : 'active'}`;
            const response = await fetch(endpoint, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('제품 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    // 카테고리 필터링
    const filteredProducts = products.filter(product => {
        if (selectedCategory === 'all') return true;
        return product.category === selectedCategory;
    });

    // 존재하는 모든 카테고리 목록 추출 (중복 제거)
    const availableCategories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    const getCategoryDisplayName = (cat: string) => CATEGORY_MAP[cat] || cat;


    // generating/pending 상태의 상품이 있는지 확인
    const hasGeneratingProducts = products.some(
        p => p.videoStatus === 'generating' || p.videoStatus === 'pending'
    );

    // 초기 로드
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // generating/pending 상태 상품이 있을 때만 5초 폴링 + sync 트리거
    useEffect(() => {
        if (!hasGeneratingProducts) return;

        // sync API 호출 (영상 완료 확인 트리거 - 관리자 페이지가 닫혀 있어도 동작)
        const triggerSync = () => {
            fetch('/api/admin/videos/sync', { method: 'GET' }).catch(() => { });
        };

        // 즉시 한 번 sync 호출
        triggerSync();

        // 15초마다 sync 호출 (영상 완료 확인)
        const syncTimer = setInterval(triggerSync, 15000);
        // 5초마다 상품 목록 갱신 (UI 반영)
        const pollTimer = setInterval(fetchProducts, 5000);

        return () => {
            clearInterval(syncTimer);
            clearInterval(pollTimer);
        };
    }, [hasGeneratingProducts, fetchProducts]);

    // 비디오 재생
    const handleVideoPlay = (product: Product) => {
        if (isEditMode) return; // 편집 모드일 때는 재생 안 함

        if (product.videoStatus === 'completed' && product.videoUrl) {
            setSelectedProduct(product);
        }
    };

    // 삭제 선택 토글
    const toggleSelectProduct = (productId: string) => {
        setSelectedToDelete(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    // 제품 삭제 처리 (휴지통 이동 또는 영구 삭제)
    const handleDeleteProducts = async () => {
        if (selectedToDelete.length === 0) return;

        const isTrash = viewMode === 'trash';
        const message = isTrash
            ? '선택한 상품을 영구 삭제하시겠습니까? 복구할 수 없습니다.'
            : '선택한 상품을 휴지통으로 이동하시겠습니까?';

        if (!confirm(message)) return;

        setLoading(true);
        try {
            const url = isTrash
                ? '/api/products?action=permanent'
                : '/api/products'; // 기본은 soft delete

            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedToDelete })
            });

            if (response.ok) {
                alert(isTrash ? '영구 삭제되었습니다.' : '휴지통으로 이동되었습니다.');
                setSelectedToDelete([]);
                setIsEditMode(false);
                fetchProducts();
            } else {
                alert('작업 실패');
                setLoading(false);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('오류가 발생했습니다.');
            setLoading(false);
        }
    };

    // 제품 복구 처리
    const handleRestoreProducts = async () => {
        if (selectedToDelete.length === 0) return;
        if (!confirm('선택한 상품을 복구하시겠습니까?')) return;

        setLoading(true);
        try {
            const response = await fetch('/api/products?action=restore', {
                method: 'DELETE', // API 설계상 DELETE 메서드 사용 중 (쿼리 파라미터로 구분)
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedToDelete })
            });

            if (response.ok) {
                alert('복구되었습니다.');
                setSelectedToDelete([]);
                fetchProducts();
            } else {
                alert('복구 실패');
                setLoading(false);
            }
        } catch (error) {
            console.error('복구 오류:', error);
            alert('오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return (
        <div className="section-padding">
            <div className="container-main">
                {/* 헤더 — 모바일 대응 flex 레이아웃 */}
                <div style={{ marginBottom: '48px' }}>

                    {/* 모바일: 상단 컨트롤 버튼 행 (휴지통/편집) - 관리자에게만 보임 */}
                    {isAdmin && (
                        <div className="products-header-controls" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            {/* 좌측: 휴지통/갤러리 전환 */}
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
                                    <>
                                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        휴지통 보기
                                    </>
                                ) : (
                                    <>
                                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        갤러리 보기
                                    </>
                                )}
                            </button>

                            {/* 우측: 편집/삭제/복구 버튼 */}
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
                                        <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
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
                                        <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
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
                                    <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {isEditMode ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 제목 — 중앙 정렬 */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h1 className="text-hero" style={{ marginBottom: '12px' }}>
                            <span className="text-gradient">
                                {viewMode === 'trash' ? '휴지통' : '제품 갤러리'}
                            </span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {viewMode === 'trash'
                                ? '삭제된 상품은 1일 후 영구 삭제됩니다.'
                                : 'AI가 소개하는 프리미엄 패션 아이템'}
                        </p>
                    </div>

                    {/* 카테고리 필터 바 — 가로 스크롤 */}
                    <div className="category-filter-wrapper">
                        <div className="category-filter-scroll">
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat || 'all')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: selectedCategory === cat ? '600' : '400',
                                        background: selectedCategory === cat ? 'var(--text-primary)' : 'var(--bg-elevated)',
                                        color: selectedCategory === cat ? 'var(--bg-card)' : 'var(--text-secondary)',
                                        border: selectedCategory === cat ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                        minHeight: '40px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {cat === 'all' ? '전체 보기' : (cat ? getCategoryDisplayName(cat) : '')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 제품 그리드 */}
                {
                    loading ? (
                        <div className="product-grid">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="product-grid">
                            {products.map(product => (
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
                                                <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
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
                                <svg style={{ width: '48px', height: '48px', color: '#a78bfa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>아직 등록된 제품이 없습니다</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                관리자 페이지에서 첫 번째 제품을 등록해보세요.
                            </p>
                            <a href="/admin" className="btn-primary">
                                제품 등록하기
                            </a>
                        </div>
                    )
                }
            </div >

            {/* 비디오 모달 */}
            < VideoModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)
                }
            />
        </div >
    );
}
