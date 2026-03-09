/**
 * productStore 호환 래퍼
 * 기존 import { productStore } from '@/lib/productStore' 경로를 유지하면서
 * 내부적으로 lib/product/ 모듈에 위임한다.
 *
 * 모든 기존 호출 코드를 수정 없이 사용 가능하다 (100% 하위 호환).
 */
import {
    addProduct,
    getProduct,
    getAllProducts,
    updateProduct,
    getPendingVideoProducts,
    deleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    getTrashProducts,
    cleanupTrash,
    updateVideoStatus as _updateVideoStatus,
    UpdateVideoStatusOptions,
    addAiMedia,
    getAiMedia,
} from './product';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from './types';

// Re-export UpdateVideoStatusOptions for convenience
export type { UpdateVideoStatusOptions };

/**
 * ProductStore 호환 객체
 * 기존 class 기반 싱글톤과 동일한 메서드 시그니처를 제공한다.
 */
export const productStore = {
    addProduct,
    getProduct,
    getAllProducts,
    updateProduct,
    getPendingVideoProducts,
    deleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    getTrashProducts,
    cleanupTrash,
    addAiMedia,
    getAiMedia,

    // updateVideoStatus: Options 객체 패턴 및 위치 매개변수 오버로딩 지원
    updateVideoStatus: _updateVideoStatus,
};

// 하위 호환: parseUtils.ts에서 re-export
export { parseColorStock, parseSizeStock } from './parseUtils';
