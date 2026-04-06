import { ai } from './genaiClient';
import { getCategoryEnglish, isClothingCategory } from './constants';
import { fetchImageAsBase64 } from './mediaUtils';
import type { Gender } from './types';

// [2026-04-01] Nano Banana 2 Flash 기반으로 전환
// 사유: 최신 이미지 생성 모델 (gemini-3.1-flash-image-preview) 적용 요청.
const IMAGE_GENERATE_MODEL = 'gemini-3.1-flash-image-preview';

type ImageResult = { success: boolean; imageBuffer?: Buffer; error?: string };

/**
 * Nano Banana 2로 텍스트 프롬프트 기반 이미지를 생성한다.
 * 참조 이미지 없이 순수 프롬프트만으로 생성.
 */
async function generateImageFromPrompt(
    prompt: string,
    logPrefix: string
): Promise<ImageResult> {
    try {
        console.log(`${logPrefix} Nano Banana 2 이미지 생성 요청 시작`);
        
        // 프롬프트에 종횡비 지정 추가
        const promptWithRatio = `${prompt}\nMake it 3:4 aspect ratio.`;

        const response = await ai.models.generateContent({
            model: IMAGE_GENERATE_MODEL,
            contents: promptWithRatio,
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!part || !part.inlineData) {
            return { success: false, error: 'API 응답에 이미지 데이터가 없습니다.' };
        }

        const imageBuffer = Buffer.from(part.inlineData.data as string, 'base64');
        console.log(`${logPrefix} Nano Banana 2 이미지 생성 성공! (${Math.round(imageBuffer.length / 1024)}KB)`);
        return { success: true, imageBuffer };

    } catch (error) {
        console.error(`${logPrefix} Nano Banana 2 생성 오류:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Nano Banana 2로 참조 이미지 기반 이미지를 편집/생성한다.
 * 원본 이미지를 함께 제공하여 생성.
 */
async function generateImageWithReference(
    prompt: string,
    imageUrl: string,
    logPrefix: string
): Promise<ImageResult> {
    try {
        const referenceImageData = await fetchImageAsBase64(imageUrl, logPrefix);
        if (!referenceImageData) {
            return { success: false, error: '참조 이미지를 다운로드할 수 없습니다.' };
        }

        console.log(`${logPrefix} Nano Banana 2 편집/참조 생성 요청 시작`);

        const promptContents = [
            { text: prompt },
            { inlineData: { mimeType: referenceImageData.mimeType, data: referenceImageData.imageBytes } }
        ];

        const response = await ai.models.generateContent({
            model: IMAGE_GENERATE_MODEL,
            contents: promptContents,
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!part || !part.inlineData) {
            return { success: false, error: 'API 응답에 이미지 데이터가 없습니다.' };
        }

        const imageBuffer = Buffer.from(part.inlineData.data as string, 'base64');
        console.log(`${logPrefix} Nano Banana 2 이미지 생성 성공! (${Math.round(imageBuffer.length / 1024)}KB)`);
        return { success: true, imageBuffer };

    } catch (error) {
        console.error(`${logPrefix} Nano Banana 2 생성 오류:`, error);
        return { success: false, error: String(error) };
    }
}

export async function generateTryOnImage(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string },
    imageUrl: string
): Promise<ImageResult> {
    const genderStr = productInfo.gender === 'female' ? 'female' : 'male';
    const categoryStr = getCategoryEnglish(productInfo.category || '');
    const isClothing = isClothingCategory(productInfo.category || '');

    // Nano Banana 2: 참조 이미지(상품)를 기반으로 모델 착용 이미지 생성
    const prompt = isClothing
        ? `A professional fashion lookbook photo showing a ${genderStr} model wearing the provided product image. Make it 3:4 aspect ratio. The product is "${productInfo.name}", a ${categoryStr} made of ${productInfo.fabric}. The model is standing in a modern minimalist studio with soft lighting, posing naturally and confidently. Highly detailed, photorealistic, e-commerce quality.`
        : `A professional product showcase photo featuring a ${genderStr} model elegantly wearing or holding the provided product image. Make it 3:4 aspect ratio. The product is "${productInfo.name}", a ${categoryStr} made of ${productInfo.fabric}. Close-up detail shot with soft studio lighting emphasizing the material's texture and craftsmanship. Modern minimalist background. Highly detailed, photorealistic.`;

    return generateImageWithReference(prompt, imageUrl, '[AI Image]');
}

/**
 * 원본 상품 사진의 배경을 프로페셔널한 스튜디오 배경으로 교체.
 * 상품 자체의 색상, 패턴, 디테일은 보존하면서 배경만 교체.
 */
export async function generateCleanProductImage(
    imageUrl: string,
    productInfo: { name: string; category?: string }
): Promise<ImageResult> {
    const categoryStr = getCategoryEnglish(productInfo.category || '');
    const isClothing = isClothingCategory(productInfo.category || '');

    // Nano Banana 2: 참조 이미지(상품)를 기반으로 깔끔한 배경 이미지 생성
    const prompt = isClothing
        ? `A professional e-commerce product photo of the ${categoryStr} garment shown in the provided product image. Make it 3:4 aspect ratio. Place the garment on a clean, minimalist white studio background with soft even lighting and subtle natural shadows. Preserve all original colors, patterns, textures, and design details exactly. High-end fashion brand product photo style. High resolution, clean composition.`
        : `A professional e-commerce product photo of the ${categoryStr} shown in the provided product image. Make it 3:4 aspect ratio. Place the product on a clean elegant display surface with minimalist white background. Use soft even lighting with subtle reflections to highlight material texture and finish. High-end brand product photo style. Macro detail emphasis, high resolution.`;

    return generateImageWithReference(prompt, imageUrl, '[AI Image]');
}
