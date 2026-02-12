'use client';

import { useState, useRef, ChangeEvent, FormEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 폼 상태
    const [formData, setFormData] = useState({
        name: '',
        fabric: '',
        gender: 'female' as 'female' | 'male',
        colorsText: '',
        sizesText: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 이미지 파일 처리
    const handleImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImagePreview(base64);
            setImageBase64(base64);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    // 파일 선택 핸들러
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    // 입력값 변경 핸들러
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // 유효성 검사
        if (!formData.name.trim()) {
            setError('상품명을 입력해주세요.');
            return;
        }
        if (!imageBase64) {
            setError('상품 이미지를 업로드해주세요.');
            return;
        }
        if (!formData.fabric.trim()) {
            setError('질감/소재를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    imageBase64,
                    fabric: formData.fabric,
                    gender: formData.gender,
                    colorsText: formData.colorsText,
                    sizesText: formData.sizesText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상품 등록에 실패했습니다.');
            }

            // 성공 시 제품 페이지로 이동
            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="section-padding">
            <div className="form-container">
                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="text-hero" style={{ marginBottom: '12px' }}>
                        <span className="text-gradient">상품 등록</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        상품 정보를 입력하면 AI가 자동으로 소개 영상을 생성합니다.
                    </p>
                </div>

                {/* 등록 폼 */}
                <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px' }}>
                    {/* 에러 메시지 */}
                    {error && (
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            marginBottom: '24px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* 이미지 업로드 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            상품 이미지 *
                        </label>
                        <div
                            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {imagePreview ? (
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={imagePreview}
                                        alt="미리보기"
                                        style={{ maxHeight: '256px', margin: '0 auto', borderRadius: '8px', objectFit: 'contain' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImagePreview(null);
                                            setImageBase64('');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            background: 'rgba(239, 68, 68, 0.8)',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>클릭하거나 이미지를 드래그하세요</p>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>PNG, JPG, WEBP 지원</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* 상품명 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            상품명 *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="예: 프리미엄 오버핏 니트"
                            className="input-field"
                        />
                    </div>

                    {/* 질감/소재 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            질감/소재 *
                        </label>
                        <input
                            type="text"
                            name="fabric"
                            value={formData.fabric}
                            onChange={handleInputChange}
                            placeholder="예: 부드러운 캐시미어 블렌드"
                            className="input-field"
                        />
                    </div>

                    {/* 성별 선택 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            의류 타입 *
                        </label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: formData.gender === 'female' ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-card)',
                                    border: formData.gender === 'female' ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={formData.gender === 'female'}
                                    onChange={handleInputChange}
                                    style={{ display: 'none' }}
                                />
                                <svg style={{ width: '24px', height: '24px', color: formData.gender === 'female' ? 'var(--color-primary)' : 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <div>
                                    <div style={{ fontWeight: '600', color: formData.gender === 'female' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>여성복</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>여성 모델 사용</div>
                                </div>
                            </label>
                            <label
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: formData.gender === 'male' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)',
                                    border: formData.gender === 'male' ? '2px solid var(--color-secondary)' : '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={formData.gender === 'male'}
                                    onChange={handleInputChange}
                                    style={{ display: 'none' }}
                                />
                                <svg style={{ width: '24px', height: '24px', color: formData.gender === 'male' ? 'var(--color-secondary)' : 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div style={{ fontWeight: '600', color: formData.gender === 'male' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>남성복</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>남성 모델 사용</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 색상별 재고 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            색상별 재고
                        </label>
                        <textarea
                            name="colorsText"
                            value={formData.colorsText}
                            onChange={handleInputChange}
                            placeholder={"색상:수량 형식으로 한 줄씩 입력\n예:\n블랙:10\n화이트:5\n베이지:3"}
                            rows={4}
                            className="input-field"
                            style={{ resize: 'none' }}
                        />
                    </div>

                    {/* 사이즈별 재고 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            사이즈별 재고
                        </label>
                        <textarea
                            name="sizesText"
                            value={formData.sizesText}
                            onChange={handleInputChange}
                            placeholder={"사이즈:수량 형식으로 한 줄씩 입력\n예:\nS:3\nM:5\nL:7\nXL:2"}
                            rows={4}
                            className="input-field"
                            style={{ resize: 'none' }}
                        />
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.125rem' }}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner" style={{ marginRight: '12px' }} />
                                <span>등록 중...</span>
                            </>
                        ) : (
                            <>
                                <svg style={{ width: '20px', height: '20px', marginRight: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>상품 등록 및 AI 영상 생성</span>
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>
                        등록된 상품은 제품 페이지에 즉시 반영됩니다.
                        AI 영상은 백그라운드에서 자동 생성됩니다.
                    </p>
                </form>
            </div>
        </div>
    );
}
