/**
 * Product 도메인 객체 팩토리
 * Zod 검증 후 데이터로부터 Product 도메인 객체를 조립한다.
 */
import { Product } from '@/lib/types';
import { parseColorStock, parseSizeStock } from '@/lib/productStore';
import { generateId } from '@/lib/utils';
import type { CreateProductInput } from './types';

export function createProductDomainObject(input: CreateProductInput): Product {
    const mediaGenerationType = input.mediaGenerationType || 'video';
    const productId = generateId();
    const colors = parseColorStock(input.colorsText || '');
    const sizes = parseSizeStock(input.sizesText || '');
    const gender = input.gender || 'female';

    return {
        id: productId,
        name: input.name,
        imageUrl: input.imageUrl || input.imageBase64 || '',
        galleryImages: input.galleryImages?.map((img) => ({
            url: img.url || img.base64 || '',
            color: img.color,
            isPrimary: img.isPrimary,
        })) || [],
        fabric: input.fabric,
        gender: gender as Product['gender'],
        category: input.category,
        colors,
        sizes,
        videoUrl: null,
        audioUrl: null,
        videoStatus: 'pending',
        mediaGenerationType,
        narrationText: input.narrationText || null,
        videoModel: input.videoModel || null,
        price: input.price,
        createdAt: new Date(),
    };
}
