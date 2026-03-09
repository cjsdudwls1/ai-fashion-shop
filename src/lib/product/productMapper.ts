/**
 * DB 로우 → Product 도메인 객체 변환 매퍼
 * productStore 내부에서만 사용하던 매핑 로직을 독립 모듈로 분리.
 */
import { Product, AiMedia, ColorStock, SizeStock } from '../types';

/** Supabase products 테이블 로우 타입 */
export interface DbProductRow {
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
    display_image_url?: string | null;
    price?: number | null;
    media_generation_type?: string | null;
    narration_text?: string | null;
    video_model?: string | null;
    created_at: string;
    deleted_at?: string | null;
    video_started_at?: string | null;
}

/** 모든 조회 메서드에서 사용하는 통합 컬럼 목록 */
export const PRODUCT_COLUMNS = 'id, name, image_url, gallery_images, fabric, gender, category, colors, sizes, video_url, audio_url, video_status, price, created_at, deleted_at, video_error_reason, kling_task_id, tryon_image_url, display_image_url, video_model, media_generation_type, narration_text, video_started_at' as const;

/** DbProductRow → Product 도메인 객체 변환 */
export function mapToProduct(data: DbProductRow): Product {
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
        displayImageUrl: data.display_image_url ?? undefined,
        price: data.price ?? undefined,
        mediaGenerationType: (data.media_generation_type as Product['mediaGenerationType']) ?? 'video',
        narrationText: data.narration_text ?? null,
        videoModel: data.video_model ?? undefined,
        createdAt: new Date(data.created_at),
        deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
        videoStartedAt: data.video_started_at ? new Date(data.video_started_at) : null,
    };
}
