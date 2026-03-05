'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { VideoModal } from '@/components/VideoModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CATEGORY_MAP } from '@/lib/constants';


export function ProductDetailView({ product }: { product: Product }) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);

    const [selectedColor, setSelectedColor] = useState<string>(product.colors.length > 0 ? product.colors[0].color : '');
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes.length > 0 ? product.sizes[0].size : '');
    const [quantity, setQuantity] = useState(1);
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Gallery Logic
    const gallery = product.galleryImages && product.galleryImages.length > 0
        ? product.galleryImages
        : [{ url: product.imageUrl, isPrimary: true, color: '' }];

    // Default to primary image or first image
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // If color changes, try to switch to image matching the color
    useEffect(() => {
        if (!selectedColor) return;
        const matchingIndex = gallery.findIndex(img => img.color === selectedColor);
        if (matchingIndex !== -1) {
            setActiveImageIndex(matchingIndex);
        }
    }, [selectedColor]);

    const activeImage = gallery[activeImageIndex] || gallery[0];

    const maxStock = useMemo(() => {
        const colorStock = product.colors.find(c => c.color === selectedColor)?.quantity || 0;
        if (product.sizes.length === 0) return colorStock;
        const sizeStock = product.sizes.find(s => s.size === selectedSize)?.quantity || 0;
        return Math.min(colorStock, sizeStock);
    }, [selectedColor, selectedSize, product.colors, product.sizes]);

    // Ensure quantity doesn't exceed available stock when options change
    useEffect(() => {
        if (quantity > maxStock) {
            setQuantity(Math.max(1, maxStock));
        }
    }, [selectedColor, selectedSize, maxStock]);

    const handleAddToCart = () => {
        if (!selectedColor && product.colors.length > 0) return toast.error(product.sizes.length === 0 ? '옵션을 선택해주세요.' : '색상을 선택해주세요.');
        if (!selectedSize && product.sizes.length > 0) return toast.error('사이즈를 선택해주세요.');
        if (quantity > maxStock) return toast.error(`재고가 부족합니다. (최대 ${maxStock}개)`);

        addItem({
            id: product.id,
            title: product.name,
            price: product.price ?? 0,
            image_url: product.imageUrl,
            selectedColor,
            selectedSize,
            quantity
        });

        toast.success(
            <div className="flex flex-col gap-2">
                <span>장바구니에 담았습니다.</span>
                <button
                    onClick={() => router.push('/cart')}
                    className="text-xs bg-[var(--text-primary)] text-[var(--bg-dark)] px-2 py-1 rounded w-fit"
                >
                    장바구니 가기
                </button>
            </div>,
            { duration: 4000 }
        );
    };

    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleBuyNow = async () => {
        if (!selectedColor && product.colors.length > 0) return toast.error(product.sizes.length === 0 ? '옵션을 선택해주세요.' : '색상을 선택해주세요.');
        if (!selectedSize && product.sizes.length > 0) return toast.error('사이즈를 선택해주세요.');
        if (quantity > maxStock) return toast.error(`재고가 부족합니다. (최대 ${maxStock}개)`);

        setIsPurchasing(true);
        try {
            // Add to cart store
            addItem({
                id: product.id,
                title: product.name,
                price: product.price ?? 0,
                image_url: product.imageUrl,
                selectedColor,
                selectedSize,
                quantity
            });

            // Redirect to checkout
            router.push('/checkout');
        } catch (error) {
            const message = error instanceof Error ? error.message : '구매 준비 중 오류가 발생했습니다.';
            toast.error(message);
        } finally {
            setIsPurchasing(false);
        }
    }

    return (
        <div className="container-main pt-24 pb-12 lg:pb-12 animate-fade-in relative z-10" style={{ paddingBottom: 'calc(48px + 80px)' }}>
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--text-muted)] mb-8 flex items-center gap-2">
                <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => router.push('/')}>홈</span>
                <span>/</span>
                <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => router.push('/products')}>상품 목록</span>
                <span>/</span>
                <span className="font-medium text-[var(--text-primary)]">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Left Column: Image/Video */}
                <div className="space-y-6">
                    {/* Main Active Image View */}
                    <div
                        className="relative aspect-[3/4] bg-[var(--bg-elevated)] rounded-lg overflow-hidden glass-card group cursor-pointer"
                        onClick={() => product.videoStatus === 'completed' ? setShowVideoModal(true) : null}
                    >
                        <Image
                            src={activeImage.url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                        />

                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.category && (
                                <span className="px-5 py-2.5 bg-black/80 backdrop-blur-md text-white text-[13px] font-bold uppercase tracking-wider rounded-full shadow-sm leading-normal">
                                    {CATEGORY_MAP[product.category] || product.category}
                                </span>
                            )}
                            {activeImage.color && (
                                <span className="px-5 py-2.5 bg-white/80 backdrop-blur-md text-black text-[13px] font-bold uppercase tracking-wider rounded-full border border-gray-200 shadow-sm leading-normal">
                                    {activeImage.color}
                                </span>
                            )}
                        </div>

                        {/* Video Overlay (영상 타입 완료 시에만 표시) */}
                        {product.videoStatus === 'completed' && product.mediaGenerationType !== 'image' && activeImage.isPrimary && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl border border-white/50">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <span className="absolute bottom-8 text-white font-medium tracking-wider text-sm">AI 피팅 영상 보기</span>
                            </div>
                        )}

                        {/* Generating Status - 미디어 타입에 따라 문구 분기 */}
                        {product.videoStatus === 'generating' && activeImage.isPrimary && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-lg flex items-center gap-3">
                                <div className="spinner w-4 h-4 border-2"></div>
                                <span className="text-white text-xs">
                                    {product.mediaGenerationType === 'image'
                                        ? 'AI 가상 피팅 이미지 생성중...'
                                        : 'AI 피팅 모델 영상 생성중...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Gallery Slider */}
                    {gallery.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                            {gallery.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`
                                        relative w-20 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 snap-start
                                        ${activeImageIndex === idx
                                            ? 'border-[var(--text-primary)] opacity-100 scale-105 shadow-md'
                                            : 'border-transparent opacity-60 hover:opacity-100'}
                                    `}
                                >
                                    <Image
                                        src={img.url}
                                        alt={`${product.name} thumbnail ${idx}`}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* AI 가상 피팅 이미지 섹션 */}
                    {product.mediaGenerationType === 'image' && product.videoStatus === 'completed' && product.tryOnImageUrl && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">AI 가상 피팅</span>
                                <span className="px-2 py-0.5 bg-[var(--primary-color)] text-white text-[10px] font-bold rounded-full">AI Generated</span>
                            </div>
                            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-[var(--border-color)] shadow-lg">
                                <Image
                                    src={product.tryOnImageUrl}
                                    alt={`${product.name} AI 가상 피팅 이미지`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                                <div className="absolute top-3 left-3">
                                    <span className="px-3 py-1.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold rounded-full">
                                        AI 피팅 결과
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Info & Actions */}
                <div className="flex flex-col h-full lg:py-2">
                    <div className="mb-auto">
                        <h1 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-2 tracking-tight leading-snug">
                            {product.name}
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] mb-6 font-normal">{product.fabric}</p>

                        <div className="flex items-end gap-3 mb-6 pb-6 border-b border-[var(--border-color)]">
                            <span className="text-2xl font-bold text-[var(--text-primary)]">
                                ₩{(product.price ?? 0).toLocaleString()}
                            </span>
                        </div>

                        <div className="space-y-8">
                            {/* Color/Option Selection */}
                            {product.colors.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            {product.sizes.length === 0 ? '옵션 (Option)' : '색상 (Color)'}
                                        </span>
                                        <span className="text-sm text-[var(--text-secondary)] capitalize">{selectedColor}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map((c) => (
                                            <button
                                                key={c.color}
                                                onClick={() => setSelectedColor(c.color)}
                                                disabled={c.quantity <= 0}
                                                className={`
                                                    min-w-[80px] px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200
                                                    ${selectedColor === c.color
                                                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-dark)] shadow-lg scale-105'
                                                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]'}
                                                    ${c.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {c.color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {product.sizes.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">사이즈 (Size)</span>
                                        <span className="text-sm text-[var(--text-secondary)] uppercase">{selectedSize}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s.size}
                                                onClick={() => setSelectedSize(s.size)}
                                                disabled={s.quantity <= 0}
                                                className={`
                                                    py-3 border rounded-lg text-sm font-medium transition-all duration-200 uppercase relative overflow-hidden
                                                    ${selectedSize === s.size
                                                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-dark)] shadow-lg'
                                                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]'}
                                                    ${s.quantity <= 0 ? 'opacity-40 cursor-not-allowed bg-[var(--bg-elevated)]' : ''}
                                                `}
                                            >
                                                {s.size}
                                                {s.quantity <= 0 && (
                                                    <span className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                                        <span className="text-[10px] font-bold text-red-500 bg-white/90 px-1 py-0.5 rounded shadow-sm rotate-12 border border-red-200">
                                                            품절
                                                        </span>
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="w-32">
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">수량</label>
                                <div className="flex items-center border border-[var(--border-color)] rounded-lg">
                                    <button
                                        className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="text"
                                        readOnly
                                        value={quantity}
                                        className="w-12 text-center text-sm font-medium outline-none bg-transparent text-[var(--text-primary)]"
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
                    </div>

                    {/* 데스크톱 CTA 버튼 (lg 이상) */}
                    <div className="mt-10 hidden lg:grid grid-cols-2 gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="py-4 rounded-xl border-2 border-[var(--text-primary)] font-bold text-[var(--text-primary)] bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--bg-dark)] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            장바구니 담기
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={isPurchasing}
                            className={`py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${isPurchasing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]'
                                }`}
                        >
                            {isPurchasing ? '구매 처리중...' : '바로 구매하기'}
                        </button>
                    </div>

                    {/* Accordion / Details */}
                    <div className="mt-20 space-y-8 border-t border-[var(--border-color)] pt-10">
                        <details className="group">
                            <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[var(--text-primary)] list-none py-2 hover:opacity-80 transition-opacity">
                                <span>상품 상세 정보</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="group-open:animate-fadeIn mt-6 text-[var(--text-secondary)] space-y-4 text-base leading-relaxed pl-1">
                                <p>성별: <span className="capitalize text-[var(--text-primary)] font-medium">{product.gender === 'female' ? '여성' : product.gender === 'male' ? '남성' : '남녀공용'}</span></p>
                                <p>등록일: {new Date(product.createdAt).toLocaleDateString()}</p>
                                <p className="leading-7 mt-4">
                                    프리미엄 퀄리티의 {product.name}입니다. {product.fabric} 소재로 제작되어 최고의 편안함과 스타일을 제공합니다.
                                    {product.gender === 'female' ? '여성분들께' : product.gender === 'male' ? '남성분들께' : '모두에게'} 추천드립니다.
                                    AI 피팅 서비스로 미래의 패션 쇼핑을 경험해보세요.
                                </p>
                            </div>
                        </details>

                        <details className="group border-t border-[var(--border-color)] pt-8">
                            <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-[var(--text-primary)] list-none py-2 hover:opacity-80 transition-opacity">
                                <span>배송 및 반품 안내</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="group-open:animate-fadeIn mt-6 text-[var(--text-secondary)] space-y-3 text-base leading-relaxed pl-1">
                                <p>🚚 <span className="font-medium text-[var(--text-primary)] ml-1">무료 배송</span> (100,000원 이상 구매 시)</p>
                                <p className="mt-2">🔄 배송 완료 후 7일 이내 교환/반품 가능 (미착용 및 원본 포장 상태 필수)</p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {showVideoModal && (
                <VideoModal product={product} onClose={() => setShowVideoModal(false)} />
            )}

            {/* 모바일 Sticky CTA (lg 미만) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]" style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 3fr' }}>
                    <button
                        onClick={handleAddToCart}
                        className="py-4 rounded-xl border-2 border-[var(--text-primary)] font-extrabold text-[var(--text-primary)] bg-transparent flex items-center justify-center gap-2 text-base active:scale-95 transition-transform"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        담기
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={isPurchasing}
                        className={`py-4 rounded-xl font-extrabold text-base active:scale-95 transition-transform ${isPurchasing
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-[var(--primary-color)] text-white shadow-lg'
                            }`}
                    >
                        {isPurchasing ? '처리중...' : '바로 구매'}
                    </button>
                </div>
            </div>
        </div>
    );
}
