/**
 * Product 모듈 Barrel Export
 * 기존 productStore의 모든 public API를 재구성하여 내보낸다.
 */

// Mapper
export { mapToProduct, PRODUCT_COLUMNS } from './productMapper';
export type { DbProductRow } from './productMapper';

// Repository
export {
    addProduct,
    getProduct,
    getAllProducts,
    updateProduct,
    getPendingVideoProducts,
} from './productRepository';

// Trash Service
export {
    deleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    getTrashProducts,
    cleanupTrash,
    runScheduledCleanup,
} from './trashService';

// Video Status Service
export { updateVideoStatus } from './videoStatusService';
export type { UpdateVideoStatusOptions } from './videoStatusService';

// AI Media Repository
export { addAiMedia, getAiMedia } from './aiMediaRepository';
