'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/types';

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
        const channels = 1; // Mono
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
export function VideoModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
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
            // 에러 발생 시 오디오 준비 상태 해제하되, 비디오 재생은 방해하지 않음
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
                // 비디오가 끝난 상태에서 다시 재생하면 처음부터
                if (video.ended) {
                    audio.currentTime = 0;
                } else if (Math.abs(audio.currentTime - video.currentTime) > 0.5) {
                    // 오차 0.5초 이상일 때만 동기화 (오디오 계속 재생 시 끊김 방지)
                    audio.currentTime = video.currentTime;
                }

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((e) => {
                        console.warn('[VideoModal] 오디오 재생 실패:', e.message);
                        // Don't set isPlaying false here, video is still playing
                    });
                }
            }
        };

        const handlePause = () => {
            // 비디오가 끝나서 멈춘 경우 오디오는 계속 재생 (단, 오디오가 더 긴 경우)
            if (video.ended && audio.duration > audio.currentTime) return;

            setIsPlaying(false);
            audio.pause();
        };

        const handleSeeked = () => {
            if (!video.ended) {
                audio.currentTime = video.currentTime;
            }
        };

        const handleVideoEnded = () => {
            // 비디오가 끝나도 오디오가 남아있으면 계속 재생
            if (audio.duration > audio.currentTime + 0.5) {
                console.log('[VideoModal] 비디오 종료, 오디오 계속 재생');
                // isPlaying은 true로 유지하여 React 상태바가 꺼지지 않게 함
            } else {
                setIsPlaying(false);
                audio.pause();
                audio.currentTime = 0; // Reset for next play
            }
        };

        const handleAudioEnded = () => {
            console.log('[VideoModal] 오디오 종료');
            setIsPlaying(false);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('ended', handleVideoEnded);
        audio.addEventListener('ended', handleAudioEnded);

        // Race Condition 방지: 오디오 로드 완료 시점에 이미 비디오가 재생 중이라면 오디오 시작
        if (!video.paused && narrationEnabled) {
            console.log('[VideoModal] 비디오가 이미 재생 중 (play 이벤트 놓침 보정)');
            handlePlay();
        }

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('ended', handleVideoEnded);
            audio.removeEventListener('ended', handleAudioEnded);
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
