import { ai } from './genaiClient';
import { Modality } from '@google/genai';
import { getCategoryEnglish, isClothingCategory } from './constants';
import { fetchImageAsBase64, extractImageFromResponse } from './mediaUtils';
import type { Gender } from './types';

// Gemini 이미지 생성 모델
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

// [2026-03-05] withRetry 함수 제거
// 사유: ECONNRESET 등 지속적 네트워크 불안정 시 1~2초 간격의 즉시 재시도는
// 성공 확률이 극히 낮으면서 유료 API 과금만 3배로 증폭시켰음.
// 상위 레벨의 sync 폴링(15초 간격)이 이미 재시도 역할을 수행하므로,
// withRetry 제거 후에도 최종 성공률에는 변동이 없음.
// 근거: .docs/api-cost-overrun-analysis.md 해결책 A

// [2026-03-06] 그룹 D 리팩토링: 공통 generateImage() 내부 함수 추출
// 사유: generateTryOnImage과 generateCleanProductImage의 구조가 90% 동일
// (이미지 다운로드 → 프롬프트 생성 → AI 호출 → 응답 파싱)하여 중복 제거
// 근거: .docs/refactoring-group-d-ai-service.md — Template Method 패턴
type ImageResult = { success: boolean; imageBuffer?: Buffer; error?: string };

/** 공통 이미지 생성 파이프라인: 참조 이미지 + 프롬프트 → AI 생성 → 결과 반환 */
async function generateImage(
    prompt: string,
    imageUrl: string,
    logPrefix: string
): Promise<ImageResult> {
    try {
        const referenceImageData = await fetchImageAsBase64(imageUrl, logPrefix);
        if (!referenceImageData) {
            return { success: false, error: '참조 이미지를 다운로드할 수 없습니다.' };
        }

        console.log(`${logPrefix} 이미지 생성 요청 시작`);

        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
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
                responseModalities: [Modality.IMAGE],
                imageConfig: {
                    aspectRatio: '3:4',
                    imageSize: '2K'
                }
            }
        });

        // [2026-03-31] 이미지 생성 시에도 안전성 필터(SAFETY) 거부 여부를 확인
        const safetyBlock = (response as any).promptFeedback?.blockReason;
        if (safetyBlock) {
            console.warn(`${logPrefix} 안전성 필터 거부 (promptFeedback):`, safetyBlock);
            return { success: false, error: `안전성 필터 위반: ${safetyBlock}` };
        }

        const firstCandidate = response.candidates?.[0];
        if (firstCandidate?.finishReason === 'SAFETY') {
            console.warn(`${logPrefix} 안전성 필터 거부 (finishReason = SAFETY)`);
            return { success: false, error: '안전성 필터 위반 (SAFETY)' };
        }

        const imageBuffer = extractImageFromResponse(response);
        if (imageBuffer) {
            console.log(`${logPrefix} 이미지 생성 성공!`);
            return { success: true, imageBuffer };
        }

        const reason = firstCandidate?.finishReason ? `(종료 사유: ${firstCandidate.finishReason})` : '';
        return { success: false, error: `API 응답에 이미지 데이터가 없습니다. ${reason}` };

    } catch (error) {
        console.error(`${logPrefix} 생성 오류:`, error);
        return { success: false, error: String(error) };
    }
}

export async function generateTryOnImage(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string },
    imageUrl: string
): Promise<ImageResult> {
    const genderStr = productInfo.gender === 'female' ? 'female' : 'male';
    const categoryStr = getCategoryEnglish(productInfo.category || '');

    // [2026-03-05] 의류/비의류 프롬프트 분기
    // 사유: 주얼리/액세서리는 "garment(의복)" 프롬프트가 부적합하므로,
    // 카테고리별로 최적화된 프롬프트를 사용하여 AI 결과물 품질을 개선한다.
    // 근거: .docs/jewelry-category-unsupported-analysis.md 해결책 B-2
    const isClothing = isClothingCategory(productInfo.category || '');

    const prompt = isClothing
        ? `A highly realistic, professional fashion lookbook photo. A beautiful ${genderStr} model wearing the exact garment shown in the reference image: "${productInfo.name}", made of ${productInfo.fabric}. The model must wear this specific ${categoryStr}, preserving the exact color, pattern, and design details from the reference image. The model is standing confidently in a modern minimalist studio with soft, flattering lighting, posing naturally. Extremely detailed, photorealistic.`
        : `A highly realistic, professional product showcase photo. A beautiful ${genderStr} model elegantly showcasing the ${categoryStr} shown in the reference image: "${productInfo.name}", made of ${productInfo.fabric}. The ${categoryStr} is the focal point of the image, captured in a close-up detail shot. The model holds or wears the ${categoryStr} naturally, with soft studio lighting emphasizing the material's texture, shine, and craftsmanship. Modern minimalist background. Extremely detailed, photorealistic.`;

    return generateImage(prompt, imageUrl, '[AI Image]');
}

/**
 * 원본 상품 사진의 배경을 프로페셔널한 스튜디오 배경으로 교체한 이미지를 생성한다.
 * 상품 자체의 색상, 패턴, 디테일은 정확히 보존하면서 배경만 교체한다.
 */
export async function generateCleanProductImage(
    imageUrl: string,
    productInfo: { name: string; category?: string }
): Promise<ImageResult> {
    const categoryStr = getCategoryEnglish(productInfo.category || '');

    // [2026-03-05] 의류/비의류 프롬프트 분기
    // 사유: 비의류 상품에 "garment" 용어를 사용하면 AI가 옷으로 해석할 수 있음.
    // 근거: .docs/jewelry-category-unsupported-analysis.md 해결책 B-3
    const isClothing = isClothingCategory(productInfo.category || '');

    const prompt = isClothing
        ? `Take this ${categoryStr} garment photo and enhance it into a professional e-commerce product image. Remove the original background completely and place the garment on a clean, minimalist white/light gray studio background with soft, even lighting and subtle natural shadows. Keep the exact garment details: preserve all colors, patterns, textures, stitching, and design elements precisely as they appear. The result should look like a high-end fashion brand's official product photo. Professional studio photography style, clean composition, high resolution.`
        : `Take this ${categoryStr} product photo and enhance it into a professional e-commerce product image. Remove the original background completely and place the ${categoryStr} on a clean, elegant display surface with a minimalist white/light gray studio background. Use soft, even lighting with subtle reflections to highlight the material's texture, finish, and fine details. The result should look like a high-end jewelry/accessories brand's official product photo. Professional studio photography style, macro detail emphasis, high resolution.`;

    return generateImage(prompt, imageUrl, '[AI Image]');
}
