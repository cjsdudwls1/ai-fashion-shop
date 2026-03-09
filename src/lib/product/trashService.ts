/**
 * 휴지통 관련 서비스
 * productStore에서 분리된 소프트 삭제, 복구, 영구 삭제, 정리(cleanup) 로직.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../types';
import { extractCloudinaryUrls, deleteCloudinaryImages } from '../cloudinaryServer';
import { supabase } from './supabaseInstance';
import { supabaseAdmin } from '../supabaseAdmin';
import { mapToProduct, PRODUCT_COLUMNS } from './productMapper';

/** 소프트 삭제 (휴지통 이동) */
export async function deleteProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
    const { error } = await client
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    return !error;
}

/** 복구 (Restore) */
export async function restoreProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
    const { error } = await client
        .from('products')
        .update({ deleted_at: null })
        .eq('id', id);
    return !error;
}

/** 영구 삭제 - Cloudinary 이미지도 함께 삭제 */
export async function permanentDeleteProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
    // 1. 삭제 전 이미지 URL 조회 (product_ai_media 포함)
    try {
        const { data: product } = await client
            .from('products')
            .select('image_url, gallery_images, video_url, tryon_image_url, display_image_url')
            .eq('id', id)
            .single();

        const { data: aiMediaRows } = await client
            .from('product_ai_media')
            .select('url')
            .eq('product_id', id);

        const urls: string[] = [];
        if (product) {
            urls.push(...extractCloudinaryUrls(product));
        }
        if (aiMediaRows) {
            urls.push(...aiMediaRows.map(r => r.url).filter(Boolean));
        }
        if (urls.length > 0) {
            await deleteCloudinaryImages(urls);
        }
    } catch (e) {
        console.error('[Cloudinary] 이미지 삭제 중 오류 (DB 삭제는 계속 진행):', e);
    }

    // 2. DB에서 삭제
    const { error } = await client
        .from('products')
        .delete()
        .eq('id', id);
    return !error;
}

/** 휴지통 상품 조회 */
export async function getTrashProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

    if (error) {
        console.error('getTrashProducts error:', error);
        throw new Error(`[getTrashProducts] DB 조회 실패: ${error.message}`);
    }
    return (data || []).map(mapToProduct);
}

/** 휴지통 비우기 (24시간 지난 항목 삭제) - Cloudinary 이미지 포함 */
export async function cleanupTrash(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. 삭제 대상 조회 (이미지 URL 포함)
    const { data: expiredProducts } = await supabase
        .from('products')
        .select('id, image_url, gallery_images, video_url, tryon_image_url, display_image_url')
        .lt('deleted_at', oneDayAgo);

    if (!expiredProducts || expiredProducts.length === 0) return;

    // 2. Cloudinary 이미지 일괄 삭제 (product_ai_media 포함)
    try {
        const expiredIds = expiredProducts.map(p => p.id);
        const { data: aiMediaRows } = await supabase
            .from('product_ai_media')
            .select('url')
            .in('product_id', expiredIds);

        const allUrls = [
            ...expiredProducts.flatMap(p => extractCloudinaryUrls(p)),
            ...(aiMediaRows || []).map(r => r.url).filter(Boolean),
        ];
        if (allUrls.length > 0) {
            await deleteCloudinaryImages(allUrls);
        }
    } catch (e) {
        console.error('[Cloudinary] 휴지통 이미지 삭제 중 오류:', e);
    }

    // 3. DB에서 삭제 (service_role로 RLS 우회)
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .lt('deleted_at', oneDayAgo);

    if (error) console.error('Trash cleanup error:', error);
}

/**
 * 스케줄 기반 cleanup 실행기
 * getAllProducts에서 1시간 간격으로 호출하던 로직을 캡슐화.
 */
let lastCleanupTime = 0;
let cleanupInProgress = false;

export async function runScheduledCleanup(): Promise<void> {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    if (!cleanupInProgress && Date.now() - lastCleanupTime > ONE_HOUR_MS) {
        cleanupInProgress = true;
        try {
            await cleanupTrash();
            lastCleanupTime = Date.now();
        } finally {
            cleanupInProgress = false;
        }
    }
}
