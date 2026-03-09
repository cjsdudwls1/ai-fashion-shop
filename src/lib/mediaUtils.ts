// 미디어 처리 공통 유틸리티
// fetchImageAsBase64: aiVideoService.ts와 aiImageService.ts에서 중복되던 이미지 다운로드 + Base64 변환 로직을 통합.

/**
 * 이미지 URL을 다운로드하여 Base64로 변환한다.
 * AI 이미지/영상 생성 시 참조 이미지로 사용된다.
 *
 * @param imageUrl - 다운로드할 이미지 URL
 * @param logPrefix - 로그 출력 시 사용할 접두사 (예: '[Veo]', '[AI Image]')
 */
export async function fetchImageAsBase64(
    imageUrl: string,
    logPrefix = '[Media]'
): Promise<{ imageBytes: string; mimeType: string } | null> {
    try {
        console.log(`${logPrefix} 참조 이미지 다운로드: ${imageUrl.substring(0, 80)}...`);
        const response = await fetch(imageUrl, { redirect: 'follow' });

        if (!response.ok) {
            console.warn(`${logPrefix} 이미지 다운로드 실패: HTTP ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // MIME 타입 정규화
        let mimeType = contentType.split(';')[0].trim();
        if (!mimeType.startsWith('image/')) {
            mimeType = 'image/jpeg';
        }

        console.log(`${logPrefix} 참조 이미지 준비 완료 (${Math.round(arrayBuffer.byteLength / 1024)}KB, ${mimeType})`);
        return { imageBytes: base64, mimeType };
    } catch (error) {
        console.warn(`${logPrefix} 참조 이미지 다운로드 오류:`, error);
        return null;
    }
}

/**
 * Gemini API 응답에서 이미지 데이터(Buffer)를 추출한다.
 * generateTryOnImage, generateCleanProductImage 등에서 공통 사용.
 */
export function extractImageFromResponse(response: {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                inlineData?: { data?: string };
            }>;
        };
    }>;
}): Buffer | null {
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
        if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, 'base64');
        }
    }
    return null;
}
