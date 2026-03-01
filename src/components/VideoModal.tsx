'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';

// 비디오 모달 컴포넌트
// Veo 3.1에서 생성된 동영상은 오디오가 내장되어 있으므로 별도 TTS 동기화 불필요
export function VideoModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!product || !product.videoUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)]"
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{product.name}</h3>
                            <p className="text-sm text-[var(--text-secondary)]">{product.fabric}</p>
                        </div>
                        {/* AI 영상 배지 */}
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 leading-normal">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                            Veo AI
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 닫기 버튼 */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 비디오 (Veo 3.1 생성 동영상은 오디오 내장) */}
                <div className="w-full aspect-video bg-black relative">
                    <video
                        src={product.videoUrl}
                        controls
                        autoPlay
                        preload="auto"
                        playsInline
                        className="w-full h-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                    >
                        브라우저가 비디오 재생을 지원하지 않습니다.
                    </video>
                </div>

                {/* 제품 상세 */}
                <div className="p-4 bg-[var(--bg-card)]">
                    {product.colors.length > 0 && (
                        <div className="mb-4 last:mb-0">
                            <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Color Options</h4>
                            <div className="flex flex-wrap gap-2">
                                {product.colors.map((color, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)]">
                                        {color.color}
                                        <span className="ml-1.5 text-[var(--text-muted)] border-l border-[var(--border-color)] pl-1.5">{color.quantity}ea</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {product.sizes.length > 0 && (
                        <div className="last:mb-0">
                            <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Size Options</h4>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)]">
                                        {size.size}
                                        <span className="ml-1.5 text-[var(--text-muted)] border-l border-[var(--border-color)] pl-1.5">{size.quantity}ea</span>
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
