/**
 * Cloudinary 이미지 삭제 유틸리티
 * 상품 영구 삭제 시 Cloudinary에 업로드된 이미지도 함께 삭제합니다.
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

/**
 * Cloudinary URL에서 public_id를 추출합니다.
 * 예: https://res.cloudinary.com/dpaqhv0ay/image/upload/v1772112081/products/gzfekfczumb5haaoj17y.webp
 * → products/gzfekfczumb5haaoj17y
 */
export function extractPublicId(url: string): string | null {
    if (!url || !url.includes('res.cloudinary.com')) return null;

    try {
        // /upload/ 이후의 경로에서 버전(v숫자/) 제거 후 확장자 제거
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return null;

        let path = url.substring(uploadIndex + '/upload/'.length);

        // 버전 번호 제거 (v1234567890/)
        if (/^v\d+\//.test(path)) {
            path = path.replace(/^v\d+\//, '');
        }

        // 확장자 제거
        const lastDot = path.lastIndexOf('.');
        if (lastDot > -1) {
            path = path.substring(0, lastDot);
        }

        return path || null;
    } catch {
        return null;
    }
}

/**
 * 상품 데이터에서 Cloudinary URL들을 추출합니다.
 */
export function extractCloudinaryUrls(product: {
    image_url?: string | null;
    gallery_images?: Array<{ url?: string }> | null;
    video_url?: string | null;
    tryon_image_url?: string | null;
    display_image_url?: string | null;
}): string[] {
    const urls: string[] = [];

    // 대표 이미지
    if (product.image_url && product.image_url.includes('res.cloudinary.com')) {
        urls.push(product.image_url);
    }

    // 영상 (Veo 생성 → Cloudinary 저장)
    if (product.video_url && product.video_url.includes('res.cloudinary.com')) {
        urls.push(product.video_url);
    }

    // AI 피팅 이미지
    if (product.tryon_image_url && product.tryon_image_url.includes('res.cloudinary.com')) {
        urls.push(product.tryon_image_url);
    }

    // AI 생성 소비자용 대표 이미지
    if (product.display_image_url && product.display_image_url.includes('res.cloudinary.com')) {
        urls.push(product.display_image_url);
    }

    // 갤러리 이미지
    if (Array.isArray(product.gallery_images)) {
        for (const img of product.gallery_images) {
            if (img.url && img.url.includes('res.cloudinary.com')) {
                urls.push(img.url);
            }
        }
    }

    return [...new Set(urls)]; // 중복 제거
}

/**
 * SHA-1 해시를 생성합니다. (Cloudinary API 서명용)
 */
async function sha1(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Node.js crypto 사용
    if (typeof globalThis.process !== 'undefined') {
        try {
            const crypto = require('crypto');
            return crypto.createHash('sha1').update(message).digest('hex');
        } catch { /* fallback */ }
    }

    // Web Crypto API fallback
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cloudinary URL에서 리소스 타입을 판별합니다.
 * URL 경로에 /video/upload/ 가 포함되어 있으면 'video', 아니면 'image'
 */
function detectResourceType(url: string): 'image' | 'video' {
    if (url.includes('/video/upload/')) return 'video';
    return 'image';
}

/**
 * Cloudinary에서 단일 리소스(이미지 또는 영상)를 삭제합니다.
 * URL에서 리소스 타입을 자동 판별하여 올바른 destroy 엔드포인트를 호출합니다.
 */
async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
        console.warn('[Cloudinary] API_KEY 또는 API_SECRET이 설정되지 않았습니다. 삭제를 건너뜁니다.');
        return false;
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = await sha1(stringToSign);

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp);
        formData.append('api_key', apiKey);
        formData.append('signature', signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
            { method: 'POST', body: formData }
        );

        const result = await response.json();

        if (result.result === 'ok') {
            console.log(`[Cloudinary] ${resourceType} 삭제 성공: ${publicId}`);
            return true;
        } else if (result.result === 'not found') {
            // Cloudinary Destroy API: 이미 삭제된 리소스는 'not found' 반환 (정상 응답, 멱등성 보장)
            console.log(`[Cloudinary] ${resourceType} 이미 삭제됨 (skip): ${publicId}`);
            return true;
        } else {
            console.warn(`[Cloudinary] ${resourceType} 삭제 실패: ${publicId}`, result);
            return false;
        }
    } catch (error) {
        console.error(`[Cloudinary] ${resourceType} 삭제 오류: ${publicId}`, error);
        return false;
    }
}

/**
 * 여러 Cloudinary URL의 리소스(이미지/영상)를 일괄 삭제합니다.
 * URL에서 리소스 타입을 자동 판별하여 올바른 API를 호출합니다.
 * Cloudinary URL이 아닌 경우 자동으로 건너뜁니다.
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
    const items = urls
        .map(url => ({
            publicId: extractPublicId(url),
            resourceType: detectResourceType(url),
        }))
        .filter((item): item is { publicId: string; resourceType: 'image' | 'video' } => item.publicId !== null);

    if (items.length === 0) {
        console.log('[Cloudinary] 삭제할 Cloudinary 리소스가 없습니다.');
        return;
    }

    const imageCount = items.filter(i => i.resourceType === 'image').length;
    const videoCount = items.filter(i => i.resourceType === 'video').length;
    console.log(`[Cloudinary] ${items.length}개 리소스 삭제 시작 (이미지: ${imageCount}, 영상: ${videoCount})...`);

    await Promise.allSettled(
        items.map(item => deleteFromCloudinary(item.publicId, item.resourceType))
    );
}

// ============================================================================
// 리소스(Image/Video) 업로드/삭제
// ============================================================================

/**
 * Signed Upload에 필요한 서명 및 공통 FormData 필드를 생성하는 내부 헬퍼.
 * API Key 검증, timestamp 생성, SHA-1 서명 생성을 한 곳에서 처리한다.
 */
async function buildSignedUpload(folder: string, publicId: string): Promise<{
    timestamp: string;
    apiKey: string;
    signature: string;
}> {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('[Cloudinary] API_KEY 또는 API_SECRET이 설정되지 않았습니다.');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1(stringToSign);

    return { timestamp, apiKey, signature };
}

/**
 * ArrayBuffer를 Cloudinary에 이미지로 업로드한다.
 * Signed Upload 방식 (API Key + Secret + SHA-1 서명)
 * 반환: Public URL (영구 접근 가능)
 */
export async function uploadImageToCloudinary(
    buffer: ArrayBuffer | Buffer,
    productId: string
): Promise<string> {
    const folder = 'ai_tryon_images';
    // folder 파라미터가 자동으로 경로 앞에 붙으므로, publicId에는 folder 접두사를 포함하지 않는다
    // (Cloudinary Upload API 공식 사양: folder는 public_id 앞에 자동 결합)
    const publicId = `${productId}_ai_tryon_${Date.now()}`;
    const { timestamp, apiKey, signature } = await buildSignedUpload(folder, publicId);

    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, `${productId}_tryon.jpg`);
    formData.append('public_id', publicId);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cloudinary 이미지 업로드 실패: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`[Cloudinary] 이미지 업로드 성공: ${result.secure_url} (${Math.round(result.bytes / 1024)}KB)`);
    return result.secure_url;
}

/**
 * ArrayBuffer를 Cloudinary에 영상으로 업로드한다.
 * Signed Upload 방식 (API Key + Secret + SHA-1 서명)
 * 반환: Public URL (영구 접근 가능)
 */
export async function uploadVideoToCloudinary(
    buffer: ArrayBuffer,
    productId: string
): Promise<string> {
    const folder = 'product_videos';
    // folder 파라미터가 자동으로 경로 앞에 붙으므로, publicId에는 folder 접두사를 포함하지 않는다
    const publicId = `${productId}_${Date.now()}`;
    const { timestamp, apiKey, signature } = await buildSignedUpload(folder, publicId);

    const blob = new Blob([buffer], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', blob, `${productId}.mp4`);
    formData.append('public_id', publicId);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('resource_type', 'video');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cloudinary 영상 업로드 실패: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    // 오디오 포함 여부 로깅 (디버깅용)
    const audioInfo = result.audio ? `audio: ${result.audio.codec}/${result.audio.frequency}Hz/${result.audio.channels}ch` : 'audio: NONE';
    console.log(`[Cloudinary] 영상 업로드 성공: ${result.secure_url} (${Math.round(result.bytes / 1024)}KB, duration: ${result.duration}s, ${audioInfo})`);
    return result.secure_url;
}

