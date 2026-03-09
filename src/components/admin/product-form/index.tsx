'use client';

import { ChangeEvent } from 'react';
import type {
    ProductFormData,
    MediaGenerationType,
    VideoModelType,
    NarrationOptionType,
} from '@/types/adminTypes';

import BasicInfoSection from './BasicInfoSection';
import MediaOptionsSection from './MediaOptionsSection';
import VideoModelSection from './VideoModelSection';
import NarrationSection from './NarrationSection';

interface ProductFormProps {
    formData: ProductFormData;
    mediaGenerationType: MediaGenerationType;
    videoModel: VideoModelType;
    narrationOption: NarrationOptionType;
    customNarration: string;
    narrationOptions: string[];
    handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handlePriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
    setMediaGenerationType: (type: MediaGenerationType) => void;
    setVideoModel: (model: VideoModelType) => void;
    setNarrationOption: (option: NarrationOptionType) => void;
    setCustomNarration: (text: string) => void;
}

/**
 * 기본 정보 + 성별/카테고리 + 미디어 생성 옵션 + 나레이션 선택 폼 컴포넌트
 */
export default function ProductForm({
    formData,
    mediaGenerationType,
    videoModel,
    narrationOption,
    customNarration,
    narrationOptions,
    handleInputChange,
    handlePriceChange,
    setMediaGenerationType,
    setVideoModel,
    setNarrationOption,
    setCustomNarration,
}: ProductFormProps) {
    return (
        <>
            <BasicInfoSection
                formData={formData}
                onChange={handleInputChange}
                onPriceChange={handlePriceChange}
            />

            <MediaOptionsSection
                value={mediaGenerationType}
                onChange={setMediaGenerationType}
            />

            {mediaGenerationType === 'video' && (
                <VideoModelSection
                    value={videoModel}
                    onChange={setVideoModel}
                />
            )}

            {mediaGenerationType === 'video' && (
                <NarrationSection
                    selectedOption={narrationOption}
                    options={narrationOptions}
                    customText={customNarration}
                    onOptionChange={setNarrationOption}
                    onCustomTextChange={setCustomNarration}
                />
            )}
        </>
    );
}
