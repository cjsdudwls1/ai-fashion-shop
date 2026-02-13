'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
                    ) : product.videoStatus === 'failed' ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.8)', // Red background
                            backdropFilter: 'blur(8px)'
                        }}>
                            <svg style={{ width: '20px', height: '20px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>영상 생성 실패</span>
                        </div>
                    ) : null}
                </div>


            </div>

            {/* 제품 정보 */}
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: 0 }}>
                        {product.name}
                    </h3>
                    {product.videoStatus === 'generating' && (
                        <span className="badge badge-warning animate-pulse" style={{ fontSize: '11px', flexShrink: 0 }}>AI 피팅모델 생성중</span>
                    )}
                    {product.videoStatus === 'completed' && (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}>
                            <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            {product.audioUrl ? '영상+나레이션' : '영상 있음'}
                        </span>
                    )}
                    {product.videoStatus === 'pending' && (
                        <span className="badge badge-info" style={{ fontSize: '11px', flexShrink: 0 }}>대기 중</span>
                    )}
                    {product.videoStatus === 'failed' && (
                        <span className="badge badge-primary" style={{ fontSize: '11px', flexShrink: 0, backgroundColor: '#ef4444', color: 'white' }}>영상 생성 실패</span>
                    )}
                </div>

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

// 오디오 Data URL 보정 유틸리티
// - MP3 (ElevenLabs): 수정 없이 그대로 사용
// - WAV (기존 Gemini TTS): 잘못된 WAV 헤더 보정
function fixAudioDataUrl(dataUrl: string): string {
    try {
        // MP3는 보정 불필요 (ElevenLabs는 MP3 반환)
        if (dataUrl.startsWith('data:audio/mpeg') || dataUrl.startsWith('data:audio/mp3')) {
            return dataUrl;
        }

        // WAV만 헤더 보정 (기존 Gemini TTS 하위 호환)
        const base64 = dataUrl.split(',')[1];
        if (!base64) return dataUrl;

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        if (bytes.length < 44) return dataUrl;
        const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (riff !== 'RIFF') return dataUrl;

        // WAV 헤더를 올바르게 재작성
        const view = new DataView(bytes.buffer);
        const pcmDataSize = bytes.length - 44;
        const sampleRate = 24000;
        const channels = 1;
        const bitDepth = 16;
        const byteRate = sampleRate * channels * (bitDepth / 8);
        const blockAlign = channels * (bitDepth / 8);

        view.setUint32(4, bytes.length - 8, true);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        view.setUint32(40, pcmDataSize, true);

        let binaryStr = '';
        for (let i = 0; i < bytes.length; i++) {
            binaryStr += String.fromCharCode(bytes[i]);
        }
        const fixedBase64 = btoa(binaryStr);
        return `data:audio/wav;base64,${fixedBase64}`;
    } catch {
        console.warn('[VideoModal] 오디오 보정 실패, 원본 사용');
        return dataUrl;
    }
}

// 비디오 모달 컴포넌트 (비디오 + TTS 나레이션 동기 재생)
function VideoModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [narrationEnabled, setNarrationEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [fixedAudioUrl, setFixedAudioUrl] = useState<string | null>(null);

    const hasNarration = !!(product?.audioUrl);

    // 오디오 URL 보정 (기존 잘못된 WAV 헤더 수정)
    useEffect(() => {
        if (!product?.audioUrl) {
            setFixedAudioUrl(null);
            setAudioReady(false);
            return;
        }
        const fixed = fixAudioDataUrl(product.audioUrl);
        setFixedAudioUrl(fixed);
    }, [product?.audioUrl]);

    // 오디오 로드 상태 확인
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !fixedAudioUrl) return;

        const handleCanPlay = () => {
            setAudioReady(true);
            console.log('[VideoModal] 오디오 로드 완료, duration:', audio.duration);
        };

        const handleError = () => {
            setAudioReady(false);
            console.error('[VideoModal] 오디오 로드 에러:', audio.error?.message);
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        // 이미 로드된 경우
        if (audio.readyState >= 3) {
            setAudioReady(true);
        }

        return () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [fixedAudioUrl]);

    // 비디오-오디오 동기화
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio || !hasNarration || !audioReady) return;

        const handlePlay = () => {
            setIsPlaying(true);
            if (narrationEnabled) {
                audio.currentTime = video.currentTime;
                audio.play().catch((e) => {
                    console.warn('[VideoModal] 오디오 재생 실패:', e.message);
                });
            }
        };

        const handlePause = () => {
            setIsPlaying(false);
            audio.pause();
        };

        const handleSeeked = () => {
            audio.currentTime = video.currentTime;
        };

        const handleEnded = () => {
            setIsPlaying(false);
            audio.pause();
            audio.currentTime = 0;
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('ended', handleEnded);
        };
    }, [hasNarration, narrationEnabled, audioReady]);

    // 나레이션 토글 처리
    useEffect(() => {
        const audio = audioRef.current;
        const video = videoRef.current;
        if (!audio || !video || !audioReady) return;

        if (narrationEnabled && isPlaying) {
            audio.currentTime = video.currentTime;
            audio.play().catch(() => { });
        } else {
            audio.pause();
        }
    }, [narrationEnabled, isPlaying, audioReady]);

    // 모달이 닫힐 때 정리
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setAudioReady(false);
            setFixedAudioUrl(null);
        };
    }, []);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <h3 style={{ fontWeight: '700', fontSize: '1.125rem' }}>{product.name}</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{product.fabric}</p>
                        </div>
                        {/* 나레이션 배지 */}
                        {hasNarration && (
                            <span className="badge badge-success" style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '11px', padding: '4px 8px'
                            }}>
                                <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                                AI 나레이션
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* 나레이션 토글 버튼 */}
                        {hasNarration && (
                            <button
                                onClick={() => setNarrationEnabled(!narrationEnabled)}
                                title={narrationEnabled ? '나레이션 끄기' : '나레이션 켜기'}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: narrationEnabled
                                        ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                        : 'rgba(100,116,139,0.2)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: narrationEnabled ? 'white' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {narrationEnabled ? (
                                    <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                    </svg>
                                ) : (
                                    <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                    </svg>
                                )}
                                {narrationEnabled ? '나레이션 ON' : '나레이션 OFF'}
                            </button>
                        )}
                        {/* 닫기 버튼 */}
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
                </div>

                {/* 비디오 */}
                <div className="video-container">
                    <video
                        ref={videoRef}
                        src={product.videoUrl}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%' }}
                    >
                        브라우저가 비디오 재생을 지원하지 않습니다.
                    </video>
                    {/* 숨겨진 오디오 요소 (나레이션 동기 재생용) */}
                    {hasNarration && fixedAudioUrl && (
                        <audio
                            ref={audioRef}
                            src={fixedAudioUrl}
                            preload="auto"
                        />
                    )}
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);

    // 제품 목록 가져오기
    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch(`/api/products?t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
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

    // 선택된 제품 삭제
    const handleDeleteProducts = async () => {
        if (selectedToDelete.length === 0) return;

        if (!confirm(`${selectedToDelete.length}개의 상품을 정말 삭제하시겠습니까?`)) return;

        try {
            setLoading(true); // 로딩 표시
            const response = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedToDelete })
            });

            if (response.ok) {
                alert('삭제되었습니다.');
                // 사용자의 요청대로 "새로 고침"하여 데이터 정합성 확실히 보장
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || '삭제 중 오류가 발생했습니다.');
                setLoading(false);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return (
        <div className="section-padding">
            <div className="container-main">
                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative' }}>
                    <h1 className="text-hero" style={{ marginBottom: '12px' }}>
                        <span className="text-gradient">제품 갤러리</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        AI가 소개하는 프리미엄 패션 아이템
                    </p>

                    {/* 관리 모드 토글 및 삭제 버튼 */}
                    <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px' }}>
                        {isEditMode && selectedToDelete.length > 0 && (
                            <button
                                onClick={handleDeleteProducts}
                                className="btn-primary"
                                style={{
                                    background: '#ef4444',
                                    padding: '8px 16px',
                                    fontSize: '14px'
                                }}
                            >
                                삭제 ({selectedToDelete.length})
                            </button>
                        )}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="glass-card"
                            style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: isEditMode ? '#a78bfa' : 'var(--text-secondary)',
                                borderColor: isEditMode ? '#a78bfa' : 'transparent'
                            }}
                        >
                            {isEditMode ? '완료' : '관리'}
                        </button>
                    </div>
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
                            <div key={product.id} style={{ position: 'relative' }}>
                                <ProductCard
                                    product={product}
                                    onVideoPlay={(p) => {
                                        if (isEditMode) {
                                            toggleSelectProduct(p.id);
                                        } else {
                                            handleVideoPlay(p);
                                        }
                                    }}
                                />
                                {isEditMode && (
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
