'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Product, AiMedia, GalleryImage } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { VideoModal } from '@/components/VideoModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductOptions } from '@/components/product/ProductOptions';
import { ProductCTA } from '@/components/product/ProductCTA';
import { ProductAccordion } from '@/components/product/ProductAccordion';


export function ProductDetailView({ product }: { product: Product }) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);

    const [selectedColor, setSelectedColor] = useState<string>(product.colors.length > 0 ? product.colors[0].color : '');
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes.length > 0 ? product.sizes[0].size : '');
    const [quantity, setQuantity] = useState(1);
    const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [aiMedia, setAiMedia] = useState<AiMedia[]>(product.aiMedia || []);

    // aiMedia가 없으면 클라이언트에서 fetch (SSR에서 못 가져온 경우)
    useEffect(() => {
        if (product.gender === 'unisex' && aiMedia.length === 0) {
            fetch(`/api/products/ai-media?productId=${product.id}`)
                .then(res => res.json())
                .then(data => { if (data.aiMedia) setAiMedia(data.aiMedia); })
                .catch(console.warn);
        }
    }, [product.id, product.gender, aiMedia.length]);

    // 선택된 성별의 AI 이미지/영상 URL 추출
    const selectedAiImage = aiMedia.find(m => m.gender === selectedGender && m.mediaType === 'image');
    const selectedAiVideo = aiMedia.find(m => m.gender === selectedGender && m.mediaType === 'video');
    const hasGenderMedia = product.gender === 'unisex' && aiMedia.length > 0;

    // Gallery Logic: AI 이미지를 최우선으로 배치
    const baseGallery = product.galleryImages && product.galleryImages.length > 0
        ? product.galleryImages
        : [{ url: product.displayImageUrl || product.imageUrl, isPrimary: true, color: '' }];

    // AI 생성 이미지를 갤러리 맨 앞에 추가
    // [2026-03-09] unisex 상품에서 aiMedia에 image 타입이 없을 때(video만 있을 때)
    // displayImageUrl을 fallback으로 사용하여 AI 이미지가 누락되지 않도록 수정
    const aiDisplayUrl = hasGenderMedia
        ? (selectedAiImage?.url || product.displayImageUrl)
        : product.displayImageUrl;

    const gallery: GalleryImage[] = [
        ...(aiDisplayUrl ? [{ url: aiDisplayUrl, isPrimary: true, color: '', isAI: true }] : []),
        ...baseGallery.map(img => ({ ...img, isPrimary: aiDisplayUrl ? false : img.isPrimary, isAI: false }))
    ];

    // 기본 이미지 또는 첫 번째 이미지를 선택
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // [2026-03-09] 사용자가 직접 색상을 변경했는지 추적
    // 초기 렌더링 시에는 AI 이미지(0번)를 유지하고,
    // 사용자가 직접 색상을 변경했을 때만 해당 색상 이미지로 전환
    const userChangedColor = useRef(false);
    const handleColorChange = (color: string) => {
        userChangedColor.current = true;
        setSelectedColor(color);
    };

    // 색상 변경 시 해당 색상 이미지로 전환 (사용자 직접 변경 시에만)
    useEffect(() => {
        if (!selectedColor || !userChangedColor.current) return;
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

    // 옵션 변경 시 수량이 재고를 초과하지 않도록 보정
    useEffect(() => {
        if (quantity > maxStock) {
            setQuantity(Math.max(1, maxStock));
        }
    }, [selectedColor, selectedSize, maxStock]);

    // 색상/사이즈/재고 유효성 검증 (장바구니 담기, 바로 구매 공통)
    const validateSelection = (): string | null => {
        if (!selectedColor && product.colors.length > 0) return product.sizes.length === 0 ? '옵션을 선택해주세요.' : '색상을 선택해주세요.';
        if (!selectedSize && product.sizes.length > 0) return '사이즈를 선택해주세요.';
        if (quantity > maxStock) return `재고가 부족합니다. (최대 ${maxStock}개)`;
        return null;
    };

    // 장바구니 아이템 생성 (장바구니 담기, 바로 구매 공통)
    const buildCartItem = () => ({
        id: product.id,
        title: product.name,
        price: product.price ?? 0,
        image_url: product.displayImageUrl || product.imageUrl,
        selectedColor,
        selectedSize,
        quantity
    });

    const handleAddToCart = () => {
        const error = validateSelection();
        if (error) return toast.error(error);

        addItem(buildCartItem());

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
        const error = validateSelection();
        if (error) return toast.error(error);

        setIsPurchasing(true);
        try {
            addItem(buildCartItem());
            router.push('/checkout');
        } catch (err) {
            const message = err instanceof Error ? err.message : '구매 준비 중 오류가 발생했습니다.';
            toast.error(message);
        } finally {
            setIsPurchasing(false);
        }
    }

    return (
        <div className="container-main pt-24 pb-12 lg:pb-12 animate-fade-in relative z-10" style={{ paddingBottom: 'calc(48px + 80px)' }}>
            {/* 브레드크럼 */}
            <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-10 flex items-center gap-3">
                <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => router.push('/')}>HOME</span>
                <span className="text-gray-300">/</span>
                <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => router.push('/products')}>SHOP</span>
                <span className="text-gray-300">/</span>
                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* 좌측: 이미지/비디오 갤러리 */}
                <ProductGallery
                    product={product}
                    gallery={gallery}
                    activeImageIndex={activeImageIndex}
                    setActiveImageIndex={setActiveImageIndex}
                    activeImage={activeImage}
                    hasGenderMedia={hasGenderMedia}
                    selectedGender={selectedGender}
                    setSelectedGender={setSelectedGender}
                    onVideoPlay={() => setShowVideoModal(true)}
                />

                {/* 우측: 상품 정보 및 액션 */}
                <div className="flex flex-col h-full lg:py-6">
                    <div className="mb-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-5xl font-serif font-medium text-[var(--text-primary)] mb-3 tracking-tight leading-[1.1]">
                                {product.name}
                            </h1>
                            <p className="text-sm uppercase tracking-widest text-[var(--text-secondary)]">{product.fabric}</p>
                        </div>

                        <div className="flex items-end gap-3 mb-10 pb-8 border-b border-[var(--border-color)]">
                            <span className="text-2xl font-light text-[var(--text-primary)]">
                                ₩{(product.price ?? 0).toLocaleString()}
                            </span>
                        </div>

                        <ProductOptions
                            product={product}
                            selectedColor={selectedColor}
                            setSelectedColor={handleColorChange}
                            selectedSize={selectedSize}
                            setSelectedSize={setSelectedSize}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            maxStock={maxStock}
                        />
                    </div>

                    {/* 데스크톱 CTA */}
                    <ProductCTA
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        isPurchasing={isPurchasing}
                    />

                    {/* 아코디언 (상세 정보, 배송 안내) */}
                    <ProductAccordion product={product} />
                </div>
            </div>

            {/* 비디오 모달 - 성별 미디어가 있으면 선택된 성별의 영상 URL 사용 */}
            {showVideoModal && (
                <VideoModal
                    product={{
                        ...product,
                        videoUrl: hasGenderMedia && selectedAiVideo
                            ? selectedAiVideo.url
                            : product.videoUrl
                    }}
                    onClose={() => setShowVideoModal(false)}
                    aiMedia={hasGenderMedia ? aiMedia : undefined}
                    selectedGender={selectedGender}
                    onGenderChange={setSelectedGender}
                />
            )}
        </div>
    );
}
