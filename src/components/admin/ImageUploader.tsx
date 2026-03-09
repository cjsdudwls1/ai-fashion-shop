'use client';

import { RefObject } from 'react';
import { Upload, X } from 'lucide-react';
import type { UploadedImage } from '@/types/adminTypes';
import type { ChangeEvent, DragEvent } from 'react';

interface ImageUploaderProps {
    images: UploadedImage[];
    isDragOver: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleRemoveImage: (id: string) => void;
    handleSetMainImage: (id: string) => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (e: DragEvent) => void;
    handleDragLeave: (e: DragEvent) => void;
    handleDrop: (e: DragEvent) => void;
}

/**
 * 이미지 업로드 영역 + 이미지 그리드 미리보기 컴포넌트
 */
export default function ImageUploader({
    images,
    isDragOver,
    fileInputRef,
    handleRemoveImage,
    handleSetMainImage,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
}: ImageUploaderProps) {
    return (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>상품 이미지 (Media)</label>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{images.length}장 업로드됨 (첫 번째 이미지가 대표 이미지)</span>
            </div>

            {/* 업로드 존 */}
            <div
                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    height: images.length > 0 ? '120px' : '240px',
                    background: 'var(--bg-elevated)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    marginBottom: '24px',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        marginBottom: '12px', width: '40px', height: '40px', margin: '0 auto 12px',
                        borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Upload size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {images.length > 0 ? '이미지 추가하기' : '이미지 업로드'}
                    </p>
                    <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>드래그 앤 드롭 또는 클릭하여 선택 (다중 선택 가능)</p>
                </div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            {/* 이미지 그리드 */}
            {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {images.map((img, idx) => (
                        <div key={img.id} style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: img.isMain ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            background: 'var(--bg-elevated)',
                        }}>
                            {/* 미리보기 */}
                            <div style={{ position: 'relative', aspectRatio: '3/4', width: '100%' }}>
                                <img src={img.preview} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {/* 삭제 버튼 */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                                    style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={14} />
                                </button>
                                {/* 대표 이미지 배지 */}
                                {img.isMain && (
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        padding: '5px 10px', borderRadius: '4px',
                                        background: 'var(--primary-color)', color: '#fff',
                                        fontSize: '13px', fontWeight: 700,
                                    }}>
                                        대표
                                    </div>
                                )}
                            </div>

                            {/* 대표 이미지 설정 */}
                            <div style={{ padding: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="mainImage"
                                        checked={img.isMain}
                                        onChange={() => handleSetMainImage(img.id)}
                                        style={{ accentColor: 'var(--primary-color)' }}
                                    />
                                    <span style={{ fontSize: '16px', fontWeight: 500 }}>대표 이미지 설정</span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
