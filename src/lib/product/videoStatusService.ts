/**
 * 영상 상태 업데이트 서비스
 * productStore에서 분리. Options 객체 패턴 + 위치 매개변수 오버로드.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../types';
import { supabase } from './supabaseInstance';

/** Options 객체 패턴 (신규 코드에서 사용 권장) */
export interface UpdateVideoStatusOptions {
    id: string;
    status: Product['videoStatus'];
    videoUrl?: string;
    audioUrl?: string;
    errorReason?: string;
    klingTaskId?: string | null;
    tryonImageUrl?: string | null;
    client?: SupabaseClient;
    videoStartedAt?: Date | null;
}

/** Options 객체 패턴 */
export async function updateVideoStatus(options: UpdateVideoStatusOptions): Promise<boolean>;
/** 위치 매개변수 오버로드 (하위 호환) */
export async function updateVideoStatus(
    id: string,
    status: Product['videoStatus'],
    videoUrl?: string,
    audioUrl?: string,
    errorReason?: string,
    klingTaskId?: string | null,
    tryonImageUrl?: string | null,
    client?: SupabaseClient,
    videoStartedAt?: Date | null,
): Promise<boolean>;
/** 구현부 */
export async function updateVideoStatus(
    idOrOptions: string | UpdateVideoStatusOptions,
    status?: Product['videoStatus'],
    videoUrl?: string,
    audioUrl?: string,
    errorReason?: string,
    klingTaskId?: string | null,
    tryonImageUrl?: string | null,
    client?: SupabaseClient,
    videoStartedAt?: Date | null,
): Promise<boolean> {
    // Options 객체 vs 위치 매개변수 판별
    let opts: UpdateVideoStatusOptions;
    if (typeof idOrOptions === 'object') {
        opts = idOrOptions;
    } else {
        opts = {
            id: idOrOptions,
            status: status!,
            videoUrl,
            audioUrl,
            errorReason,
            klingTaskId,
            tryonImageUrl,
            client,
            videoStartedAt,
        };
    }

    const dbClient = opts.client ?? supabase;
    const updates: Record<string, unknown> = { video_status: opts.status };
    if (opts.videoUrl !== undefined) updates.video_url = opts.videoUrl;
    if (opts.audioUrl !== undefined) updates.audio_url = opts.audioUrl;
    if (opts.errorReason !== undefined) updates.video_error_reason = opts.errorReason;
    if (opts.klingTaskId !== undefined) updates.kling_task_id = opts.klingTaskId;
    if (opts.tryonImageUrl !== undefined) updates.tryon_image_url = opts.tryonImageUrl;
    if (opts.videoStartedAt !== undefined) {
        updates.video_started_at = opts.videoStartedAt ? opts.videoStartedAt.toISOString() : null;
    }

    const { error } = await dbClient
        .from('products')
        .update(updates)
        .eq('id', opts.id);

    if (error) console.error('updateVideoStatus error:', error);
    return !error;
}
