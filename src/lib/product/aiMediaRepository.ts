/**
 * product_ai_media CRUD
 * productStore에서 분리된 AI 미디어 관련 데이터 접근 레이어.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AiMedia } from '../types';
import { supabase } from './supabaseInstance';

/** AI 미디어 추가/업데이트 (upsert) */
export async function addAiMedia(
    productId: string,
    gender: 'male' | 'female',
    mediaType: 'image' | 'video',
    url: string,
    client: SupabaseClient = supabase
): Promise<void> {
    const { error } = await client
        .from('product_ai_media')
        .upsert(
            {
                product_id: productId,
                gender,
                media_type: mediaType,
                url,
            },
            { onConflict: 'product_id,gender,media_type' }
        );

    if (error) {
        console.error('[aiMediaRepository] addAiMedia error:', error);
        throw error;
    }
}

/** 특정 상품의 AI 미디어 전체 조회 */
export async function getAiMedia(productId: string): Promise<AiMedia[]> {
    const { data, error } = await supabase
        .from('product_ai_media')
        .select('id, gender, media_type, url')
        .eq('product_id', productId);

    if (error || !data) return [];
    return data.map(row => ({
        id: row.id,
        gender: row.gender as 'male' | 'female',
        mediaType: row.media_type as 'image' | 'video',
        url: row.url,
    }));
}
