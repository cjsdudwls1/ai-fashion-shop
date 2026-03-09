'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ChevronRight, X, VolumeX } from 'lucide-react';
import { Product, AiMedia } from '@/lib/types';

interface VideoModalProps {
    product: Product | null;
    onClose: () => void;
    aiMedia?: AiMedia[];
    selectedGender?: 'female' | 'male';
    onGenderChange?: (gender: 'female' | 'male') => void;
}

// 비디오 모달 컴포넌트
// Veo 3.1에서 생성된 동영상은 오디오가 내장되어 있으므로 별도 TTS 동기화 불필요
// 모바일 브라우저 정책: autoPlay는 muted 상태에서만 허용됨 → 음소거 해제 버튼 제공
export function VideoModal({ product, onClose, aiMedia, selectedGender, onGenderChange }: VideoModalProps) {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // 기본값: 소리 켜진 상태로 시작 (사용자 요구)
    const videoRef = useRef<HTMLVideoElement>(null);

    // muted 상태가 변경될 때 video 요소에 직접 반영 (React의 muted prop 하드코딩 문제 해결)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // 모달 마운트 시 비디오를 unmuted 상태로 재생 시도
    // 브라우저가 unmuted 자동재생을 차단하면 muted로 폴백
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // 기본적으로 unmuted 상태로 play() 시도
        video.muted = false;
        video.volume = 1;
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // unmuted 재생 성공 → 소리 켜진 상태 유지
                    setIsMuted(false);
                })
                .catch(() => {
                    // 브라우저가 unmuted 자동재생 차단 → muted로 폴백 재시도
                    video.muted = true;
                    setIsMuted(true);
                    video.play().catch(() => {
                        // muted로도 실패하면 사용자가 수동 재생
                    });
                });
        }
    }, [product?.videoUrl]);

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

    const hasMultipleVideos = aiMedia && aiMedia.filter(m => m.mediaType === 'video').length > 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                            <Video className="w-4 h-4" />
                            Veo AI
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 상세페이지 이동 버튼 */}
                        <button
                            onClick={() => {
                                onClose();
                                router.push(`/products/${product.id}`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 border border-[var(--border-color)]"
                        >
                            상세보기
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        {/* 남녀 전환 토글 (unisex 상품이고 aiMedia에 영상이 2개 이상일 때만) */}
                        {hasMultipleVideos && onGenderChange && (
                            <div className="flex rounded-full overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)]">
                                <button
                                    onClick={() => onGenderChange('female')}
                                    className={`px-3 py-1.5 text-xs font-bold transition-all ${selectedGender === 'female'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    WOMEN
                                </button>
                                <button
                                    onClick={() => onGenderChange('male')}
                                    className={`px-3 py-1.5 text-xs font-bold transition-all ${selectedGender === 'male'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    MEN
                                </button>
                            </div>
                        )}
                        {/* 닫기 버튼 */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 비디오 (Veo 3.1 생성 동영상은 오디오 내장) */}
                {/* 자동재생: muted + autoPlay 시작 → 사용자 인터랙션 후 음소거 해제 가능 */}
                <div className="w-full aspect-video bg-black relative">
                    <video
                        ref={videoRef}
                        src={product.videoUrl ?? undefined}
                        controls
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
                            <VolumeX size={18} />
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
