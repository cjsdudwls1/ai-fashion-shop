'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { Product, AiMedia, GalleryImage } from '@/lib/types';
import { CATEGORY_MAP } from '@/lib/constants';

interface ProductGalleryProps {
    product: Product;
    gallery: GalleryImage[];
    activeImageIndex: number;
    setActiveImageIndex: (index: number) => void;
    activeImage: GalleryImage;
    hasGenderMedia: boolean;
    selectedGender: 'female' | 'male';
    setSelectedGender: (gender: 'female' | 'male') => void;
    onVideoPlay: () => void;
}

export function ProductGallery({
    product,
    gallery,
    activeImageIndex,
    setActiveImageIndex,
    activeImage,
    hasGenderMedia,
    selectedGender,
    setSelectedGender,
    onVideoPlay,
}: ProductGalleryProps) {
    return (
        <div className="space-y-6">
            {/* 메인 이미지 */}
            <div
                className="relative aspect-[3/4] bg-[var(--bg-elevated)] rounded-lg overflow-hidden glass-card group cursor-pointer"
                onClick={() => product.videoStatus === 'completed' ? onVideoPlay() : null}
            >
                <Image
                    src={activeImage.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                />

                {/* 남녀공용 성별 전환 토글 */}
                {hasGenderMedia && (
                    <div className="absolute top-4 right-4 z-20 flex rounded-full overflow-hidden border border-white/30 shadow-lg backdrop-blur-md bg-black/30">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedGender('female'); setActiveImageIndex(0); }}
                            className={`px-4 py-2 text-xs font-bold transition-all ${selectedGender === 'female'
                                ? 'bg-white text-black'
                                : 'text-white/80 hover:text-white'
                                }`}
                        >
                            WOMEN
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedGender('male'); setActiveImageIndex(0); }}
                            className={`px-4 py-2 text-xs font-bold transition-all ${selectedGender === 'male'
                                ? 'bg-white text-black'
                                : 'text-white/80 hover:text-white'
                                }`}
                        >
                            MEN
                        </button>
                    </div>
                )}

                {/* 상태 뱃지 */}
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
                    {activeImage.isAI && (
                        <span className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-bold uppercase tracking-wider rounded-full shadow-sm leading-normal">
                            AI Enhanced
                        </span>
                    )}
                </div>

                {/* 비디오 오버레이 (영상 타입 완료 시에만 표시) */}
                {product.videoStatus === 'completed' && product.mediaGenerationType !== 'image' && activeImage.isPrimary && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl border border-white/50">
                            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </div>
                        <span className="absolute bottom-8 text-white font-medium tracking-wider text-sm">AI 피팅 영상 보기</span>
                    </div>
                )}

                {/* 생성 중 상태 - 미디어 타입에 따라 문구 분기 */}
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

            {/* 썸네일 갤러리 슬라이더 */}
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
    );
}
