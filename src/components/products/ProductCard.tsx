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
            className="group flex flex-col relative w-full overflow-hidden"
            onClick={handleImageClick}
        >
            {/* 제품 이미지 (Lookbook 스타일, 세로로 긴 3:4 비율 권장) */}
            <div className="relative w-full aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden cursor-pointer">
                <Image
                    src={product.imageUrl || product.displayImageUrl || product.tryOnImageUrl || '/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* 품절 오버레이 */}
                {totalColorStock === 0 && totalSizeStock === 0 && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span className="text-black font-semibold text-xs tracking-[0.2em] bg-white/80 px-4 py-2">
                            SOLD OUT
                        </span>
                    </div>
                )}

                {/* 영상 및 AI 상태 오버레이 (미니멀 글래스모피즘) */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
                    {product.videoStatus === 'generating' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-black/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-pulse" />
                            <span className="text-[10px] font-semibold text-black tracking-widest uppercase">AI Generating</span>
                        </div>
                    )}
                    {product.videoStatus === 'completed' && product.videoUrl && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-black/5">
                            <Play className="w-3 h-3 text-black fill-black" />
                            <span className="text-[10px] font-semibold text-black tracking-widest uppercase">Video</span>
                        </div>
                    )}
                    {product.videoStatus === 'failed' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50/80 backdrop-blur-md border border-red-500/20">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] font-semibold text-red-600 tracking-widest uppercase">Failed</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 제품 정보 (Minimal & Editorial) */}
            <div className="pt-4 pb-2 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-semibold font-serif tracking-wide text-[var(--text-primary)] hover:text-gray-500 transition-colors cursor-pointer line-clamp-1">
                        {product.name}
                    </h3>
                    {product.price != null && product.price > 0 && (
                        <span className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
                            ₩{product.price.toLocaleString()}
                        </span>
                    )}
                </div>

                <p className="text-[12px] text-[var(--text-muted)] mt-1 tracking-wide line-clamp-1">
                    {product.category || 'Collection'} 
                    {product.fabric && ` · ${product.fabric}`}
                </p>

                {/* Color/Size indicators (Minimal dots) */}
                {(product.colors.length > 0 || product.sizes.length > 0) && (
                    <div className="flex items-center gap-4 mt-3" onClick={handleControlClick}>
                        {product.colors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {product.colors.filter((c: any) => c.quantity > 0).slice(0, 4).map((color: any, idx: number) => (
                                    <div 
                                        key={idx}
                                        title={color.color}
                                        className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color.color.toLowerCase() }}
                                    />
                                ))}
                                {product.colors.filter((c: any) => c.quantity > 0).length > 4 && (
                                    <span className="text-[10px] text-[var(--text-muted)] ml-1">+</span>
                                )}
                            </div>
                        )}
                        
                        {product.sizes.length > 0 && (
                            <div className="flex gap-1.5 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                                {product.sizes.filter((s: any) => s.quantity > 0).map((size: any, idx: number) => (
                                    <span key={idx}>{size.size}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
