'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Product } from '@/lib/types';

// 비디오 모달 컴포넌트
// Veo 3.1에서 생성된 동영상은 오디오가 내장되어 있으므로 별도 TTS 동기화 불필요
// 모바일 브라우저 정책: autoPlay는 muted 상태에서만 허용됨 → 음소거 해제 버튼 제공
export function VideoModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // 모바일 자동재생을 위해 muted로 시작
    const videoRef = useRef<HTMLVideoElement>(null);

    // muted 상태가 변경될 때 video 요소에 직접 반영 (React의 muted prop 하드코딩 문제 해결)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // 네이티브 controls에서 볼륨/음소거를 변경했을 때도 상태를 동기화
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVolumeChange = () => {
            setIsMuted(video.muted || video.volume === 0);
        };

        video.addEventListener('volumechange', handleVolumeChange);
        return () => video.removeEventListener('volumechange', handleVolumeChange);
    }, []);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            // 음소거 해제 시 볼륨이 0이면 볼륨도 올려줌
            if (!newMuted && videoRef.current.volume === 0) {
                videoRef.current.volume = 1;
            }
            setIsMuted(newMuted);
        }
    }, [isMuted]);

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
                {/* 자동재생: muted + autoPlay 시작 → 사용자 인터랙션 후 음소거 해제 가능 */}
                <div className="w-full aspect-video bg-black relative">
                    <video
                        ref={videoRef}
                        src={product.videoUrl}
                        controls
                        autoPlay
                        muted={true}
                        preload="auto"
                        playsInline
                        className="w-full h-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                    >
                        브라우저가 비디오 재생을 지원하지 않습니다.
                    </video>
                    {/* 음소거 해제 버튼 - 모바일에서 소리를 켜기 위한 UX */}
                    {isPlaying && isMuted && (
                        <button
                            onClick={toggleMute}
                            style={{
                                position: 'absolute',
                                bottom: '60px',
                                right: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '999px',
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                animation: 'pulse 2s ease-in-out infinite',
                                zIndex: 10,
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                            탭하여 소리 켜기
                        </button>
                    )}
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
