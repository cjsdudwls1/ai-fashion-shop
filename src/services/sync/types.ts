/**
 * Sync 서비스 타입 정의
 */
import { Product } from '@/lib/types';

/** Sync 핸들러 간 공유 컨텍스트 */
export interface SyncContext {
    product: Product;
    supabaseAdmin: import('@supabase/supabase-js').SupabaseClient;
}

/** 핸들러 결과 */
export interface SyncHandlerResult {
    processed: boolean;
    skipped?: boolean;
}
