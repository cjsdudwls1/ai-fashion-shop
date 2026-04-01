import { ai } from './genaiClient';
import { SubjectReferenceImage, SubjectReferenceType } from '@google/genai';
import { getCategoryEnglish, isClothingCategory } from './constants';
import { fetchImageAsBase64 } from './mediaUtils';
import type { Gender } from './types';

// [2026-03-31] Imagen 3 기반으로 전환
// 사유: Vertex AI 프로젝트에서 gemini-*-image-preview 모델이 404 반환.
//       gemini-2.5-flash는 Multi-modal output 미지원.
//       imagen-3.0-generate-002 (생성) + imagen-3.0-capability-001 (편집)은 정상 작동 확인됨.
const IMAGEN_GENERATE_MODEL = 'imagen-3.0-generate-002';
const IMAGEN_EDIT_MODEL = 'imagen-3.0-capability-001';

type ImageResult = { success: boolean; imageBuffer?: Buffer; error?: string };

/**
 * Imagen 3으로 텍스트 프롬프트 기반 이미지를 생성한다.
 * 참조 이미지 없이 순수 프롬프트만으로 생성.
 */
async function generateImageFromPrompt(
    prompt: string,
    logPrefix: string
): Promise<ImageResult> {
    try {
        console.log(`${logPrefix} Imagen 이미지 생성 요청 시작`);
        
        const response = await ai.models.generateImages({
            model: IMAGEN_GENERATE_MODEL,
            prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '3:4',
                includeRaiReason: true,
            }
        });

        const images = response.generatedImages || [];
        if (images.length === 0) {
            const raiReason = (response as any).raiFilteredReason;
            return { success: false, error: `이미지 생성 결과 없음${raiReason ? ` (RAI: ${raiReason})` : ''}` };
        }

        const imageBytes = images[0]?.image?.imageBytes;
        if (!imageBytes) {
            return { success: false, error: 'API 응답에 이미지 데이터가 없습니다.' };
        }

        const imageBuffer = Buffer.from(imageBytes, 'base64');
        console.log(`${logPrefix} Imagen 이미지 생성 성공! (${Math.round(imageBuffer.length / 1024)}KB)`);
        return { success: true, imageBuffer };

    } catch (error) {
        console.error(`${logPrefix} Imagen 생성 오류:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Imagen 3 editImage로 참조 이미지 기반 이미지를 편집/생성한다.
 * SubjectReferenceImage를 사용하여 상품 참조 이미지를 기반으로 새 이미지 생성.
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

        console.log(`${logPrefix} Imagen editImage 요청 시작`);

        const subjectRef = new SubjectReferenceImage();
        subjectRef.referenceId = 1;
        subjectRef.referenceImage = {
            imageBytes: referenceImageData.imageBytes,
            mimeType: referenceImageData.mimeType,
        } as any;
        subjectRef.config = {
            subjectType: SubjectReferenceType.SUBJECT_TYPE_PRODUCT,
        };

        const response = await ai.models.editImage({
            model: IMAGEN_EDIT_MODEL,
            prompt,
            referenceImages: [subjectRef],
            config: {
                numberOfImages: 1,
                includeRaiReason: true,
            }
        });

        const images = response.generatedImages || [];
        if (images.length === 0) {
            const raiReason = (response as any).raiFilteredReason;
            return { success: false, error: `이미지 편집 결과 없음${raiReason ? ` (RAI: ${raiReason})` : ''}` };
        }

        const imageBytes = images[0]?.image?.imageBytes;
        if (!imageBytes) {
            return { success: false, error: 'API 응답에 이미지 데이터가 없습니다.' };
        }

        const imageBuffer = Buffer.from(imageBytes, 'base64');
        console.log(`${logPrefix} Imagen editImage 성공! (${Math.round(imageBuffer.length / 1024)}KB)`);
        return { success: true, imageBuffer };

    } catch (error) {
        console.error(`${logPrefix} Imagen editImage 오류:`, error);
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

    // Imagen editImage: 참조 이미지(상품)를 기반으로 모델 착용 이미지 생성
    const prompt = isClothing
        ? `A professional fashion lookbook photo showing a ${genderStr} model wearing the product [1]. The product is "${productInfo.name}", a ${categoryStr} made of ${productInfo.fabric}. The model is standing in a modern minimalist studio with soft lighting, posing naturally and confidently. Highly detailed, photorealistic, e-commerce quality.`
        : `A professional product showcase photo featuring a ${genderStr} model elegantly wearing or holding the product [1]. The product is "${productInfo.name}", a ${categoryStr} made of ${productInfo.fabric}. Close-up detail shot with soft studio lighting emphasizing the material's texture and craftsmanship. Modern minimalist background. Highly detailed, photorealistic.`;

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

    // Imagen editImage: 참조 이미지(상품)를 기반으로 깔끔한 배경 이미지 생성
    const prompt = isClothing
        ? `A professional e-commerce product photo of the ${categoryStr} garment shown as product [1]. Place the garment on a clean, minimalist white studio background with soft even lighting and subtle natural shadows. Preserve all original colors, patterns, textures, and design details exactly. High-end fashion brand product photo style. High resolution, clean composition.`
        : `A professional e-commerce product photo of the ${categoryStr} shown as product [1]. Place the product on a clean elegant display surface with minimalist white background. Use soft even lighting with subtle reflections to highlight material texture and finish. High-end brand product photo style. Macro detail emphasis, high resolution.`;

    return generateImageWithReference(prompt, imageUrl, '[AI Image]');
}
