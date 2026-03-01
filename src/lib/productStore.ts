import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, ColorStock, SizeStock } from './types';
import { extractCloudinaryUrls, deleteCloudinaryImages } from './cloudinaryUtils';

// Node.js 환경에서 가끔 발생하는 Supabase 도메인 DNS (IPv6) 해석 실패 버그 우회
if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    try {
        const dns = require('node:dns');
        if (dns && dns.setDefaultResultOrder) {
            dns.setDefaultResultOrder('ipv4first');
        }
    } catch (e) {
        // 브라우저나 Edge 환경일 경우 무시
    }
}

// Supabase DB 로우 타입 (productStore 내부 전용)
interface DbProductRow {
    id: string;
    name: string;
    image_url: string;
    gallery_images?: { url: string; color?: string; isPrimary?: boolean }[] | null;
    fabric: string;
    gender: string;
    category?: string | null;
    colors: { color: string; quantity: number }[];
    sizes: { size: string; quantity: number }[];
    video_url?: string | null;
    audio_url?: string | null;
    video_status: Product['videoStatus'];
    video_error_reason?: string | null;
    kling_task_id?: string | null;
    tryon_image_url?: string | null;
    price?: number | null;
    media_generation_type?: string | null;
    narration_text?: string | null;
    video_model?: string | null;
    created_at: string;
    deleted_at?: string | null;
}

// Fetch 캐싱을 우회하고 일시적 네트워크 오류 시 재시도하는 커스텀 fetch
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            // Next.js의 fetch 캐싱을 완벽히 우회하기 위해 cache: 'no-store' 추가
            const res = await fetch(url, { ...options, cache: 'no-store' });
            return res;
        } catch (err: any) {
            lastError = err;
            console.warn(`[Supabase Fetch] 시도 ${i + 1}/${maxRetries} 실패: ${err.message}`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
    }
    throw lastError;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';
const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: customFetch
    }
});

class ProductStore {
    // 상품 추가 (서버 사이드에서 Admin Client 사용 가능하도록 변경)
    async addProduct(product: Product, client: SupabaseClient = supabase): Promise<void> {
        const { error } = await client
            .from('products')
            .insert({
                id: product.id,
                name: product.name,
                image_url: product.imageUrl,
                gallery_images: product.galleryImages, // Save gallery
                fabric: product.fabric,
                gender: product.gender,
                category: product.category, // New field for Supabase
                colors: product.colors,
                sizes: product.sizes,
                video_url: product.videoUrl,
                audio_url: product.audioUrl,
                video_status: product.videoStatus,
                price: product.price, // Added price field
                media_generation_type: product.mediaGenerationType || 'video',
                narration_text: product.narrationText || null,
                video_model: product.videoModel || null,
                created_at: product.createdAt
            });

        if (error) {
            console.error('Supabase addProduct error:', error);
            throw error;
        }
    }

    // 상품 조회
    async getProduct(id: string): Promise<Product | undefined> {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, image_url, fabric, gender, category, colors, sizes, video_url, audio_url, video_status, price, created_at, deleted_at, video_error_reason, kling_task_id, tryon_image_url, video_model')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;
        return this.mapToProduct(data);
    }

    // 전체 상품 조회 (최신순, 삭제되지 않은 것만)
    // cleanupTrash는 1시간에 최대 1회만 실행 (불필요한 DB 조회 방지)
    private lastCleanupTime = 0;

    async getAllProducts(): Promise<Product[]> {
        const ONE_HOUR_MS = 60 * 60 * 1000;
        if (Date.now() - this.lastCleanupTime > ONE_HOUR_MS) {
            await this.cleanupTrash();
            this.lastCleanupTime = Date.now();
        }

        const { data, error } = await supabase
            .from('products')
            .select('id, name, image_url, fabric, gender, category, colors, sizes, video_url, video_status, price, created_at, deleted_at, video_error_reason, kling_task_id, tryon_image_url, video_model')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase getAllProducts error:', error);
            return [];
        }
        return (data || []).map(this.mapToProduct);
    }

    // 휴지통 상품 조회
    async getTrashProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, image_url, fabric, gender, category, colors, sizes, video_url, video_status, price, created_at, deleted_at, video_error_reason, kling_task_id, tryon_image_url, video_model')
            .not('deleted_at', 'is', null) // 삭제된 항목만
            .order('deleted_at', { ascending: false });

        if (error) {
            console.error('Supabase getTrashProducts error:', error);
            return [];
        }
        return (data || []).map(this.mapToProduct);
    }

    // AI 영상 생성 폴링용 상품 조회 (pending, tryon_polling, video_polling 등)
    async getPendingVideoProducts(limit = 5): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, image_url, fabric, gender, category, colors, sizes, video_url, audio_url, video_status, price, created_at, deleted_at, video_error_reason, kling_task_id, tryon_image_url, video_model, media_generation_type, narration_text')
            .in('video_status', ['pending', 'generating', 'tryon_polling', 'video_polling'])
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Supabase getPendingVideoProducts error:', error);
            return [];
        }
        return (data || []).map(this.mapToProduct);
    }

    // 상품 업데이트
    async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
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
        if (updates.mediaGenerationType !== undefined) dbUpdates.media_generation_type = updates.mediaGenerationType;
        if (updates.narrationText !== undefined) dbUpdates.narration_text = updates.narrationText;
        if (updates.videoModel !== undefined) dbUpdates.video_model = updates.videoModel;

        const { error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id);

        return !error;
    }

    // 상품 삭제 (휴지통으로 이동 - Soft Delete)
    async deleteProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
        const { error } = await client
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        return !error;
    }

    // 상품 복구 (Restore)
    async restoreProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
        const { error } = await client
            .from('products')
            .update({ deleted_at: null })
            .eq('id', id);
        return !error;
    }

    // 영구 삭제 (Permanent Delete) - Cloudinary 이미지도 함께 삭제
    async permanentDeleteProduct(id: string, client: SupabaseClient = supabase): Promise<boolean> {
        // 1. 삭제 전 이미지 URL 조회
        try {
            const { data: product } = await client
                .from('products')
                .select('image_url, gallery_images, video_url, tryon_image_url')
                .eq('id', id)
                .single();

            if (product) {
                const urls = extractCloudinaryUrls(product);
                if (urls.length > 0) {
                    await deleteCloudinaryImages(urls);
                }
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

    // 휴지통 비우기 (24시간 지난 항목 삭제) - Cloudinary 이미지도 함께 삭제
    async cleanupTrash(): Promise<void> {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. 삭제 대상 조회 (이미지 URL 포함)
        const { data: expiredProducts } = await supabase
            .from('products')
            .select('id, image_url, gallery_images, video_url, tryon_image_url')
            .lt('deleted_at', oneDayAgo);

        if (!expiredProducts || expiredProducts.length === 0) return;

        // 2. Cloudinary 이미지 일괄 삭제
        try {
            const allUrls = expiredProducts.flatMap(p => extractCloudinaryUrls(p));
            if (allUrls.length > 0) {
                await deleteCloudinaryImages(allUrls);
            }
        } catch (e) {
            console.error('[Cloudinary] 휴지통 이미지 삭제 중 오류:', e);
        }

        // 3. DB에서 삭제
        const { error } = await supabase
            .from('products')
            .delete()
            .lt('deleted_at', oneDayAgo);

        if (error) console.error('Trash cleanup error:', error);
    }

    // 영상 상태 업데이트
    async updateVideoStatus(
        id: string,
        status: Product['videoStatus'],
        videoUrl?: string,
        audioUrl?: string,
        errorReason?: string,
        klingTaskId?: string | null,
        tryonImageUrl?: string | null,
        client: SupabaseClient = supabase
    ): Promise<boolean> {
        const updates: Record<string, unknown> = { video_status: status };
        if (videoUrl !== undefined) updates.video_url = videoUrl;
        if (audioUrl !== undefined) updates.audio_url = audioUrl;
        if (errorReason !== undefined) updates.video_error_reason = errorReason;
        if (klingTaskId !== undefined) updates.kling_task_id = klingTaskId;
        if (tryonImageUrl !== undefined) updates.tryon_image_url = tryonImageUrl;

        const { error } = await client
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) console.error('Supabase updateVideoStatus error:', error);
        return !error;
    }

    private mapToProduct(data: DbProductRow): Product {
        return {
            id: data.id,
            name: data.name,
            imageUrl: data.image_url,
            galleryImages: data.gallery_images || [],
            fabric: data.fabric,
            gender: data.gender as Product['gender'],
            category: data.category || 'short-sleeve',
            colors: data.colors as ColorStock[],
            sizes: data.sizes as SizeStock[],
            videoUrl: data.video_url ?? null,
            audioUrl: data.audio_url ?? null,
            videoStatus: data.video_status,
            videoErrorReason: data.video_error_reason ?? undefined,
            klingTaskId: data.kling_task_id ?? undefined,
            tryOnImageUrl: data.tryon_image_url ?? undefined,
            price: data.price ?? undefined,
            mediaGenerationType: (data.media_generation_type as Product['mediaGenerationType']) ?? 'video',
            narrationText: data.narration_text ?? null,
            videoModel: data.video_model ?? undefined,
            createdAt: new Date(data.created_at),
            deletedAt: data.deleted_at ? new Date(data.deleted_at) : null
        };
    }
}

// 싱글톤 인스턴스
export const productStore = new ProductStore();

// 텍스트 파싱 유틸리티
export function parseColorStock(text: string): ColorStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [color, quantity] = line.split(':').map(s => s.trim());
        return {
            color: color || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.color);
}

export function parseSizeStock(text: string): SizeStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [size, quantity] = line.split(':').map(s => s.trim());
        return {
            size: size || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.size);
}
