'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import type { UploadedImage } from '@/types/adminTypes';

/**
 * 이미지 업로드, 압축, 드래그 앤 드롭 로직을 캡슐화하는 커스텀 훅
 */
export function useImageUpload() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    /** 이미지 압축 및 처리 */
    const handleImageFiles = async (files: FileList | null) => {
        if (!files) return;

        const newImages: UploadedImage[] = [];

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp' as const,
        };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            try {
                const compressedFile = await imageCompression(file, options);
                const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);

                newImages.push({
                    id: crypto.randomUUID().slice(0, 9),
                    file: compressedFile,
                    preview: previewUrl,
                    isMain: false,
                    color: '',
                });
            } catch (err) {
                console.error('Image compression error:', err);
                toast.error(`${file.name} 처리 중 오류가 발생했습니다.`);
            }
        }

        setImages(prev => {
            const combined = [...prev, ...newImages];
            if (combined.length > 0 && !combined.some(img => img.isMain)) {
                combined[0].isMain = true;
            }
            return combined;
        });
    };

    /** 이미지 삭제 */
    const handleRemoveImage = (id: string) => {
        setImages(prev => {
            const filtered = prev.filter(img => img.id !== id);
            if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
                filtered[0].isMain = true;
            }
            return filtered;
        });
    };

    /** 대표 이미지 설정 */
    const handleSetMainImage = (id: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            isMain: img.id === id,
        })));
    };

    /** 이미지 색상 설정 */
    const handleSetImageColor = (id: string, color: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            color: img.id === id ? color : img.color,
        })));
    };

    /** 파일 입력 변경 핸들러 */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleImageFiles(e.target.files);
    };

    /** 드래그 오버 핸들러 */
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    /** 드래그 리브 핸들러 */
    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    /** 드롭 핸들러 */
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleImageFiles(e.dataTransfer.files);
    };

    return {
        images,
        isDragOver,
        fileInputRef,
        handleRemoveImage,
        handleSetMainImage,
        handleSetImageColor,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
