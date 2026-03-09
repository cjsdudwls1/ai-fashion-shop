/**
 * 관리자 페이지 관련 타입 정의
 */

/** 재고 항목 */
export interface StockItem {
    id: number;
    color: string;
    size: string;
    quantity: number;
}

/** 업로드된 이미지 */
export interface UploadedImage {
    id: string;
    file: File | null;
    preview: string;
    url?: string;
    isMain: boolean;
    color?: string;
}

/** 상품 등록 폼 데이터 */
export interface ProductFormData {
    name: string;
    fabric: string;
    price: string;
    gender: 'female' | 'male' | 'unisex';
    category: string;
}

/** 미디어 생성 타입 */
export type MediaGenerationType = 'video' | 'image' | 'none';

/** 영상 모델 타입 */
export type VideoModelType = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';

/** 나레이션 옵션 타입 */
export type NarrationOptionType = 'auto1' | 'auto2' | 'auto3' | 'custom';
