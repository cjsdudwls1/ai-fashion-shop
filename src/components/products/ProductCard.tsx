'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Play } from 'lucide-react';

export interface ProductCardProps {
    product: Product;
    onVideoPlay: (product: Product) => void;
}

export function ProductCard({ product, onVideoPlay }: ProductCardProps) {
    const router = useRouter();
    const totalColorStock = product.colors.reduce((sum: number, c: any) => sum + c.quantity, 0);
    const totalSizeStock = product.sizes.reduce((sum: number, s: any) => sum + s.quantity, 0);

    const [selectedColor, setSelectedColor] = useState<string>(product.colors.length > 0 ? product.colors[0].color : '');
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes.length > 0 ? product.sizes[0].size : '');

    const handleControlClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.videoStatus === 'completed' && product.videoUrl) {
            onVideoPlay(product);
        } else {
            router.push(`/products/${product.id}`);
        }
    };

    return (
        <div
            className="glass-card group"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'block', position: 'relative' }}
        >
            {/* 제품 이미지 */}
            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }} onClick={handleImageClick}>
                <Image
                    src={product.displayImageUrl || product.tryOnImageUrl || product.imageUrl}
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

                {/* 영상 오버레이 */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: (product.videoStatus === 'generating' || product.videoStatus === 'failed') ? 1 : 0,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
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
                                background: 'rgba(239, 68, 68, 0.9)',
                                backdropFilter: 'blur(8px)',
                                cursor: 'help'
                            }}
                        >
                            <AlertTriangle size={20} color="white" />
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
            <div style={{ padding: '20px' }} onClick={() => router.push(`/products/${product.id}`)}>
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
                            <Play size={12} fill="currentColor" />
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
        </div>
    );
}
