import { GoogleGenAI } from '@google/genai';
import type { Gender } from './types';

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
const VEO_MODEL = 'gemini-3.1-flash-image-preview';

const CATEGORY_MAP: Record<string, string> = {
    'short-sleeve': 'short-sleeve T-shirt',
    'long-sleeve': 'long-sleeve T-shirt',
    'sleeveless': 'sleeveless top',
    'shirt': 'shirt',
    'knit': 'knit sweater',
    'hoodie': 'hoodie',
    'pants': 'pants',
    'shorts': 'shorts',
    'skirt': 'skirt',
    'denim': 'denim jeans',
    'slacks': 'slacks',
    'jacket': 'jacket',
    'coat': 'coat',
    'padding': 'padded jacket',
    'cardigan': 'cardigan',
    'onepiece': 'one-piece dress',
    'set': 'coordinated set',
    'underwear': 'underwear',
    'etc': 'fashion item',
};

async function fetchImageAsBase64(imageUrl: string): Promise<{ imageBytes: string; mimeType: string } | null> {
    try {
        console.log(`[AI Image] 참조 이미지 다운로드: ${imageUrl.substring(0, 80)}...`);
        const response = await fetch(imageUrl, { redirect: 'follow' });

        if (!response.ok) {
            console.warn(`[AI Image] 이미지 다운로드 실패: HTTP ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        let mimeType = contentType.split(';')[0].trim();
        if (!mimeType.startsWith('image/')) {
            mimeType = 'image/jpeg';
        }

        console.log(`[AI Image] 참조 이미지 준비 완료 (${Math.round(arrayBuffer.byteLength / 1024)}KB, ${mimeType})`);
        return { imageBytes: base64, mimeType };
    } catch (error) {
        console.warn(`[AI Image] 참조 이미지 다운로드 오류:`, error);
        return null;
    }
}

export async function generateTryOnImage(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string },
    imageUrl: string
): Promise<{ success: boolean; imageBuffer?: Buffer; error?: string }> {
    try {
        const referenceImageData = await fetchImageAsBase64(imageUrl);
        if (!referenceImageData) {
            return { success: false, error: '참조 이미지를 다운로드할 수 없습니다.' };
        }

        const genderStr = productInfo.gender === 'female' ? 'female' : 'male';
        const categoryStr = (productInfo.category && CATEGORY_MAP[productInfo.category]) || 'fashion item';

        const prompt = `A highly realistic, professional fashion lookbook photo. A beautiful ${genderStr} model wearing the exact garment shown in the reference image: "${productInfo.name}", made of ${productInfo.fabric}. The model must wear this specific ${categoryStr}, preserving the exact color, pattern, and design details from the reference image. The model is standing confidently in a modern minimalist studio with soft, flattering lighting, posing naturally. Extremely detailed, photorealistic.`;

        console.log(`[AI Image] 이미지 생성 요청 시작`);

        const response = await ai.models.generateContent({
            model: VEO_MODEL,
            contents: [
                prompt,
                {
                    inlineData: {
                        mimeType: referenceImageData.mimeType,
                        data: referenceImageData.imageBytes
                    }
                }
            ],
            config: {
                // @ts-ignore
                responseModalities: ['IMAGE'],
                imageConfig: {
                    aspectRatio: '3:4',
                    imageSize: '1K'
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
            return { success: false, error: 'API 응답에서 생성된 콘텐츠를 찾을 수 없습니다.' };
        }

        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                const buffer = Buffer.from(part.inlineData.data, "base64");
                console.log(`[AI Image] 이미지 생성 성공!`);
                return { success: true, imageBuffer: buffer };
            }
        }

        return { success: false, error: 'API 응답에서 이미지 데이터를 찾을 수 없습니다.' };

    } catch (error) {
        console.error('[AI Image] 생성 오류:', error);
        return { success: false, error: String(error) };
    }
}
