/**
 * 상품 서비스 타입
 */
import { Product } from '@/lib/types';

/** 상품 생성 입력 (Zod 검증 후 데이터) */
export interface CreateProductInput {
    name: string;
    imageUrl?: string;
    imageBase64?: string;
    galleryImages?: { url?: string; base64?: string; color?: string; isPrimary?: boolean }[];
    fabric: string;
    gender?: string;
    category?: string;
    colorsText?: string;
    sizesText?: string;
    price?: number;
    mediaGenerationType?: 'video' | 'image' | 'none';
    narrationText?: string;
    videoModel?: string;
}

/** 상품 생성 결과 */
export interface CreateProductResult {
    product: Product;
    message: string;
}
