'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { VideoModal } from '@/components/VideoModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const categoryNameMap: Record<string, string> = {
    'all': '전체',
    'short-sleeve': '반팔',
    'long-sleeve': '긴팔',
    'sleeveless': '민소매',
    'shirt': '셔츠/블라우스',
    'knit': '니트/스웨터',
    'hoodie': '후드/맨투맨',
    'pants': '긴바지',
    'shorts': '반바지',
    'skirt': '치마',
    'denim': '데님/청바지',
    'slacks': '슬랙스',
    'jacket': '재킷/점퍼',
    'coat': '코트',
    'padding': '패딩',
    'cardigan': '가디건',
    'onepiece': '원피스',
    'set': '세트/투피스',
    'underwear': '속옷/언더웨어',
    'etc': '기타',
};

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

    const getStockStatus = () => {
        const colorStock = product.colors.find(c => c.color === selectedColor)?.quantity || 0;
        const sizeStock = product.sizes.find(s => s.size === selectedSize)?.quantity || 0;
        return Math.min(colorStock, sizeStock);
    };

    // Ensure quantity doesn't exceed available stock when options change
    useEffect(() => {
        const maxStock = getStockStatus();
        if (quantity > maxStock) {
            setQuantity(Math.max(1, maxStock));
        }
    }, [selectedColor, selectedSize]); // Dependency array ensures it runs when selection changes

    const handleAddToCart = () => {
        const maxStock = getStockStatus();
        if (!selectedColor && product.colors.length > 0) return toast.error('색상을 선택해주세요.');
        if (!selectedSize && product.sizes.length > 0) return toast.error('사이즈를 선택해주세요.');
        if (quantity > maxStock) return toast.error(`재고가 부족합니다. (최대 ${maxStock}개)`);

        addItem({
            id: product.id,
            title: product.name,
            price: product.price || 59000,
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
        const maxStock = getStockStatus();
        if (!selectedColor && product.colors.length > 0) return toast.error('색상을 선택해주세요.');
        if (!selectedSize && product.sizes.length > 0) return toast.error('사이즈를 선택해주세요.');
        if (quantity > maxStock) return toast.error(`재고가 부족합니다. (최대 ${maxStock}개)`);

        setIsPurchasing(true);
        try {
            const response = await fetch(`/api/products/${product.id}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    color: selectedColor,
                    size: selectedSize,
                    quantity: quantity
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '구매 처리에 실패했습니다.');
            }

            toast.success('구매가 완료되었습니다! (재고 차감됨)');

            // 재고 UI 업데이트를 위해 페이지 새로고침 (또는 로컬 상태 업데이트)
            // 임시 테스트용이므로 새로고침이 가장 확실함
            setTimeout(() => {
                window.location.reload();
            }, 1500);

            // 원래 로직 (장바구니 추가 등)
            // addItem calls... (Optional now as we did direct purchase logic)
            addItem({
                id: product.id,
                title: product.name,
                price: product.price || 59000,
                image_url: product.imageUrl,
                selectedColor,
                selectedSize,
                quantity
            });
            // router.push('/checkout'); // Disable checkout redirect for test to see toast
        } catch (error) {
            const message = error instanceof Error ? error.message : '구매 중 오류가 발생했습니다.';
            toast.error(message);
        } finally {
            setIsPurchasing(false);
        }
    }

    return (
        <div className="container-main pt-24 pb-12 animate-fade-in relative z-10">
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
                                <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full">
                                    {categoryNameMap[product.category] || product.category}
                                </span>
                            )}
                            {activeImage.color && (
                                <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-black text-xs font-bold uppercase tracking-wider rounded-full border border-gray-200">
                                    {activeImage.color}
                                </span>
                            )}
                        </div>

                        {/* Video Overlay (Only on main/video capable view if we separate them? For now show everywhere if completed) */}
                        {product.videoStatus === 'completed' && activeImage.isPrimary && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl border border-white/50">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <span className="absolute bottom-8 text-white font-medium tracking-wider text-sm">AI 피팅 영상 보기</span>
                            </div>
                        )}

                        {/* Generating Status */}
                        {product.videoStatus === 'generating' && activeImage.isPrimary && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-lg flex items-center gap-3">
                                <div className="spinner w-4 h-4 border-2"></div>
                                <span className="text-white text-xs">AI 피팅 모델 영상 생성중...</span>
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
                </div>

                {/* Right Column: Info & Actions */}
                <div className="flex flex-col h-full lg:py-4">
                    <div className="mb-auto">
                        <h1 className="text-4xl md:text-5xl font-light text-[var(--text-primary)] mb-2 tracking-tight leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] mb-6 font-light">{product.fabric}</p>

                        <div className="flex items-end gap-3 mb-8 pb-8 border-b border-[var(--border-color)]">
                            <span className="text-3xl font-bold text-[var(--text-primary)]">
                                ₩{(product.price || 59000).toLocaleString()}
                            </span>
                        </div>

                        <div className="space-y-8">
                            {/* Color Selection */}
                            {product.colors.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">색상 (Color)</span>
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
                                        onClick={() => setQuantity(Math.min(getStockStatus(), quantity + 1))}
                                        disabled={quantity >= getStockStatus()}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-4">
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
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                                }`}
                        >
                            {isPurchasing ? '구매 처리중...' : '바로 구매하기'}
                        </button>
                    </div>

                    {/* Accordion / Details */}
                    <div className="mt-12 space-y-4 border-t border-[var(--border-color)] pt-8">
                        <details className="group">
                            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] list-none">
                                <span>상품 상세 정보</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="group-open:animate-fadeIn mt-3 text-[var(--text-secondary)] space-y-2 text-sm">
                                <p>성별: <span className="capitalize">{product.gender === 'female' ? '여성' : product.gender === 'male' ? '남성' : '남녀공용'}</span></p>
                                <p>등록일: {new Date(product.createdAt).toLocaleDateString()}</p>
                                <p className="leading-relaxed mt-2">
                                    프리미엄 퀄리티의 {product.name}입니다. {product.fabric} 소재로 제작되어 최고의 편안함과 스타일을 제공합니다.
                                    {product.gender === 'female' ? '여성분들께' : product.gender === 'male' ? '남성분들께' : '모두에게'} 추천드립니다.
                                    AI 피팅 서비스로 미래의 패션 쇼핑을 경험해보세요.
                                </p>
                            </div>
                        </details>
                        <details className="group border-t border-[var(--border-color)] pt-4">
                            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] list-none">
                                <span>배송 및 반품 안내</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="group-open:animate-fadeIn mt-3 text-[var(--text-secondary)] text-sm">
                                <p>100,000원 이상 구매 시 무료 배송</p>
                                <p className="mt-2">배송 완료 후 7일 이내 교환/반품 가능 (미착용 및 원본 포장 상태 필수)</p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {showVideoModal && (
                <VideoModal product={product} onClose={() => setShowVideoModal(false)} />
            )}
        </div>
    );
}
