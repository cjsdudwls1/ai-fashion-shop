'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/types';

// 제품 카드 컴포넌트
function ProductCard({ product, onVideoPlay }: { product: Product; onVideoPlay: (product: Product) => void }) {
    const totalColorStock = product.colors.reduce((sum, c) => sum + c.quantity, 0);
    const totalSizeStock = product.sizes.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <div
            className="glass-card"
            onClick={() => onVideoPlay(product)}
            style={{ overflow: 'hidden', cursor: 'pointer' }}
        >
            {/* 제품 이미지 */}
            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                />

                {/* 영상 재생 오버레이 */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} className="card-overlay">
                    {product.videoStatus === 'completed' && product.videoUrl ? (
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg style={{ width: '32px', height: '32px', color: 'white', marginLeft: '4px' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    ) : product.videoStatus === 'generating' ? (
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
                    ) : null}
                </div>

                {/* 영상 상태 배지 */}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {product.videoStatus === 'completed' && (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            영상 있음
                        </span>
                    )}
                    {product.videoStatus === 'generating' && (
                        <span className="badge badge-warning animate-pulse">생성 중</span>
                    )}
                    {product.videoStatus === 'pending' && (
                        <span className="badge badge-info">대기 중</span>
                    )}
                </div>
            </div>

            {/* 제품 정보 */}
            <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '8px' }}>
                    {product.name}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    {product.fabric}
                </p>

                {/* 색상 */}
                {product.colors.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>색상</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({totalColorStock}개)</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {product.colors.map((color, idx) => (
                                <span key={idx} className="badge badge-primary" style={{ fontSize: '11px' }}>
                                    {color.color} ({color.quantity})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 사이즈 */}
                {product.sizes.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>사이즈</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({totalSizeStock}개)</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {product.sizes.map((size, idx) => (
                                <span key={idx} className="badge badge-info" style={{ fontSize: '11px' }}>
                                    {size.size} ({size.quantity})
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .glass-card:hover .card-overlay {
          opacity: 1 !important;
        }
        .glass-card:hover img {
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
}

// 비디오 모달 컴포넌트
function VideoModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    if (!product || !product.videoUrl) return null;

    return (
        <div
            className="animate-fade-in"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div
                className="glass-card"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '900px', width: '100%', overflow: 'hidden' }}
            >
                {/* 헤더 */}
                <div style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(100,116,139,0.3)'
                }}>
                    <div>
                        <h3 style={{ fontWeight: '700', fontSize: '1.125rem' }}>{product.name}</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{product.fabric}</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 비디오 */}
                <div className="video-container">
                    <video
                        src={product.videoUrl}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%' }}
                    >
                        브라우저가 비디오 재생을 지원하지 않습니다.
                    </video>
                </div>

                {/* 제품 상세 */}
                <div className="modal-grid" style={{ padding: '16px' }}>
                    {product.colors.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>색상 옵션</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {product.colors.map((color, idx) => (
                                    <span key={idx} className="badge badge-primary">
                                        {color.color}: {color.quantity}개
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {product.sizes.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>사이즈 옵션</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {product.sizes.map((size, idx) => (
                                    <span key={idx} className="badge badge-info">
                                        {size.size}: {size.quantity}개
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 로딩 스켈레톤
function ProductSkeleton() {
    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div className="animate-shimmer" style={{ aspectRatio: '1/1' }} />
            <div style={{ padding: '20px' }}>
                <div className="animate-shimmer" style={{ height: '24px', width: '75%', borderRadius: '4px', marginBottom: '12px' }} />
                <div className="animate-shimmer" style={{ height: '16px', width: '50%', borderRadius: '4px', marginBottom: '8px' }} />
                <div className="animate-shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // 제품 목록 가져오기
    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('제품 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 초기 로드 및 주기적 폴링 (영상 상태 업데이트 확인)
    useEffect(() => {
        fetchProducts();

        // 5초마다 제품 목록 갱신 (영상 생성 상태 확인)
        const interval = setInterval(fetchProducts, 5000);

        return () => clearInterval(interval);
    }, [fetchProducts]);

    // 비디오 재생
    const handleVideoPlay = (product: Product) => {
        if (product.videoStatus === 'completed' && product.videoUrl) {
            setSelectedProduct(product);
        }
    };

    return (
        <div className="section-padding">
            <div className="container-main">
                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 className="text-hero" style={{ marginBottom: '12px' }}>
                        <span className="text-gradient">제품 갤러리</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        AI가 소개하는 프리미엄 패션 아이템
                    </p>
                </div>

                {/* 제품 그리드 */}
                {loading ? (
                    <div className="product-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="product-grid">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onVideoPlay={handleVideoPlay}
                            />
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
