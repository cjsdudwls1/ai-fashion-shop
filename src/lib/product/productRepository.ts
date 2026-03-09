/**
 * 상품 Repository
 * productStore에서 분리된 상품 CRUD + 조회 로직.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Product, AiMedia } from '../types';
import { supabase } from './supabaseInstance';
import { mapToProduct, PRODUCT_COLUMNS } from './productMapper';
import { getAiMedia } from './aiMediaRepository';
import { runScheduledCleanup } from './trashService';

/** 상품 추가 */
export async function addProduct(product: Product, client: SupabaseClient = supabase): Promise<void> {
    const { error } = await client
        .from('products')
        .insert({
            id: product.id,
            name: product.name,
            image_url: product.imageUrl,
            gallery_images: product.galleryImages,
            fabric: product.fabric,
            gender: product.gender,
            category: product.category,
            colors: product.colors,
            sizes: product.sizes,
            video_url: product.videoUrl,
            audio_url: product.audioUrl,
            video_status: product.videoStatus,
            price: product.price,
            media_generation_type: product.mediaGenerationType || 'video',
            narration_text: product.narrationText || null,
            video_model: product.videoModel || null,
            created_at: product.createdAt,
        });

    if (error) {
        console.error('addProduct error:', error);
        throw error;
    }
}

/** 단건 상품 조회 (aiMedia 포함) */
export async function getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    const product = mapToProduct(data);
    product.aiMedia = await getAiMedia(id);
    return product;
}

/** 전체 상품 조회 (최신순, 미삭제, 스케줄 cleanup 포함) */
export async function getAllProducts(): Promise<Product[]> {
    // 1시간 간격 휴지통 정리 (side-effect)
    await runScheduledCleanup();

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getAllProducts error:', error);
        throw new Error(`[getAllProducts] DB 조회 실패: ${error.message}`);
    }

    const products = (data || []).map(mapToProduct);

    // aiMedia 일괄 조회
    const productIds = products.map(p => p.id);
    if (productIds.length > 0) {
        const { data: aiMediaRows } = await supabase
            .from('product_ai_media')
            .select('id, product_id, gender, media_type, url')
            .in('product_id', productIds);
        if (aiMediaRows) {
            const mediaMap = new Map<string, AiMedia[]>();
            for (const row of aiMediaRows) {
                const arr = mediaMap.get(row.product_id) || [];
                arr.push({ id: row.id, gender: row.gender, mediaType: row.media_type, url: row.url });
                mediaMap.set(row.product_id, arr);
            }
            for (const p of products) {
                p.aiMedia = mediaMap.get(p.id) || [];
            }
        }
    }
    return products;
}

/**
 * 상품 업데이트
 * [2026-03-08] client 매개변수 추가 — 서버 사이드(API route, sync worker)에서
 * supabaseAdmin(service_role)을 전달하여 RLS UPDATE 정책 우회.
 * 기본값 supabase(anon key)는 클라이언트 사이드 호출 호환성 유지.
 * 근거: .docs/phase1-infinite-loop-rls-solution.md §4-1
 */
export async function updateProduct(id: string, updates: Partial<Product>, client: SupabaseClient = supabase): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.fabric !== undefined) dbUpdates.fabric = updates.fabric;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.colors !== undefined) dbUpdates.colors = updates.colors;
    if (updates.sizes !== undefined) dbUpdates.sizes = updates.sizes;
    if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;
    if (updates.videoStatus !== undefined) dbUpdates.video_status = updates.videoStatus;
    if (updates.videoErrorReason !== undefined) dbUpdates.video_error_reason = updates.videoErrorReason;
    if (updates.klingTaskId !== undefined) dbUpdates.kling_task_id = updates.klingTaskId;
    if (updates.tryOnImageUrl !== undefined) dbUpdates.tryon_image_url = updates.tryOnImageUrl;
    if (updates.displayImageUrl !== undefined) dbUpdates.display_image_url = updates.displayImageUrl;
    if (updates.mediaGenerationType !== undefined) dbUpdates.media_generation_type = updates.mediaGenerationType;
    if (updates.narrationText !== undefined) dbUpdates.narration_text = updates.narrationText;
    if (updates.videoModel !== undefined) dbUpdates.video_model = updates.videoModel;

    const { error } = await client
        .from('products')
        .update(dbUpdates)
        .eq('id', id);

    return !error;
}

/**
 * AI 영상 생성 폴링용 상품 조회
 * [2026-03-08] client 매개변수 추가 — 서버 사이드(sync worker)에서
 * supabaseAdmin(service_role)을 전달하여 RLS SELECT 정책 우회.
 * 기본값 supabase(anon key)는 클라이언트 사이드 호출 호환성 유지.
 * 근거: .docs/veo-pipeline-structural-analysis.md 결함 B
 */
export async function getPendingVideoProducts(limit = 5, client: SupabaseClient = supabase): Promise<Product[]> {
    const { data, error } = await client
        .from('products')
        .select(PRODUCT_COLUMNS)
        .in('video_status', ['pending', 'generating', 'generating_male'])
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('getPendingVideoProducts error:', error);
        return [];
    }
    return (data || []).map(mapToProduct);
}
