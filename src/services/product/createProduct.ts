/**
 * 상품 생성 비즈니스 로직 오케스트레이션
 * 검증 → 객체 생성 → DB 저장 → sync 트리거
 */
import { productStore } from '@/lib/productStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createProductDomainObject } from './productFactory';
import { triggerSync } from './triggerSync';
import type { CreateProductInput, CreateProductResult } from './types';

export async function createProduct(
    input: CreateProductInput,
    host: string | null,
    isDev: boolean,
): Promise<CreateProductResult> {
    const product = createProductDomainObject(input);
    const mediaType = product.mediaGenerationType || 'video';

    // DB 저장
    await productStore.addProduct(product, supabaseAdmin);
    console.log(`[Product] 새 상품 등록: ${product.id} - ${input.name} (${product.gender === 'female' ? '여성복' : '남성복'}) [미디어: ${mediaType}]`);

    // AI 미디어 생성 자동 트리거 (fire-and-forget)
    console.log(`[Product] AI 미디어 생성 트리거 시작... (Sync Worker 킥오프) [모드: ${mediaType}]`);
    triggerSync(host, isDev);

    const message =
        mediaType === 'video'
            ? '상품이 등록되었습니다. AI 영상이 백그라운드에서 안전하게 생성됩니다.'
            : mediaType === 'image'
                ? '상품이 등록되었습니다. AI 이미지가 백그라운드에서 생성됩니다.'
                : '상품이 등록되었습니다.';

    return { product, message };
}
