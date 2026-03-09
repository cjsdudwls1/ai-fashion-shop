/**
 * 클라이언트 전용 Cloudinary 업로드 유틸리티
 * NEXT_PUBLIC_ 환경변수를 사용하여 브라우저에서 직접 Cloudinary에 업로드합니다.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn(
        '[clientCloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 또는 NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET 환경변수가 설정되지 않았습니다.'
    );
}

/**
 * File 객체를 Cloudinary에 업로드하고 HTTPS CDN URL을 반환합니다.
 * (Unsigned Preset 방식 — 브라우저 클라이언트 전용)
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('[clientCloudinary] Cloudinary 환경변수가 설정되지 않았습니다.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'products');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary 업로드 실패');
    }

    const data = await response.json();
    return data.secure_url as string;
}
