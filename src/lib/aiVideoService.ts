// AI 동영상 생성 서비스 - Google Veo 3.1 Fast
// 워크플로우: 상품 이미지 참조 + 텍스트 프롬프트 → 동영상+오디오 생성

import { GoogleGenAI } from '@google/genai';
import { productStore } from './productStore';
import { supabaseAdmin } from './supabaseAdmin';
import type { Gender } from './types';

// ============================================================================
// Google Veo 3.1 Fast API 설정
// ============================================================================

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// Veo 모델 및 기본 설정
const VEO_MODEL = 'veo-3.1-fast-generate-preview';
const VEO_RESOLUTION = '720p'; // Veo 3.1 Fast는 720p만 지원
const VEO_DURATION = 8; // Veo는 4, 6, 8초만 지원 (7초에 가장 가까운 값)
const VEO_ASPECT_RATIO = '16:9';

// ============================================================================
// 프롬프트 생성 유틸리티
// ============================================================================

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

function buildVideoPrompt(productInfo: {
    name: string;
    fabric: string;
    gender: Gender;
    category?: string;
    hasReferenceImage?: boolean;
    narrationText?: string;
}): string {
    const genderStr = productInfo.gender === 'female' ? 'female' : 'male';
    const categoryStr = (productInfo.category && CATEGORY_MAP[productInfo.category]) || 'fashion item';

    // 나레이션 대사 결정: 사용자 입력이 있으면 사용, 없으면 자동 생성
    const narration = productInfo.narrationText
        ? productInfo.narrationText
        : `${productInfo.name}. ${productInfo.fabric} 소재의 프리미엄 ${categoryStr}입니다.`;

    if (productInfo.hasReferenceImage) {
        // 참조 이미지가 있을 때: 이미지 속 옷을 정확히 재현하도록 유도
        return `A high-end fashion commercial video. A professional ${genderStr} model wearing the exact garment shown in the reference image - "${productInfo.name}", made of ${productInfo.fabric}. The model must wear this specific ${categoryStr} from the reference image, preserving the exact color, pattern, and design details. The model walks confidently in a modern minimalist studio with soft cinematic lighting, turns to show the garment details, and poses elegantly. Camera slowly orbits around the model. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional fashion video.`;
    }

    // 참조 이미지가 없을 때: 기존 텍스트 전용 프롬프트
    return `A high-end fashion commercial video. A professional ${genderStr} model wearing "${productInfo.name}", a premium ${productInfo.fabric} ${categoryStr}. The model walks confidently in a modern minimalist studio with soft cinematic lighting, turns to show the garment details, and poses elegantly. Camera slowly orbits around the model. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional fashion video.`;
}

// ============================================================================
// 이미지 URL → Base64 변환 유틸리티
// ============================================================================
async function fetchImageAsBase64(imageUrl: string): Promise<{ imageBytes: string; mimeType: string } | null> {
    try {
        console.log(`[Veo] 참조 이미지 다운로드: ${imageUrl.substring(0, 80)}...`);
        const response = await fetch(imageUrl, { redirect: 'follow' });

        if (!response.ok) {
            console.warn(`[Veo] 이미지 다운로드 실패: HTTP ${response.status}`);
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

        console.log(`[Veo] 참조 이미지 준비 완료 (${Math.round(arrayBuffer.byteLength / 1024)}KB, ${mimeType})`);
        return { imageBytes: base64, mimeType };
    } catch (error) {
        console.warn(`[Veo] 참조 이미지 다운로드 오류:`, error);
        return null;
    }
}

// ============================================================================
// Veo 영상 생성 트리거 (Non-blocking)
// imageUrl이 있으면 참조 이미지로 전달하여 실제 상품과 일치하는 영상 생성
// ============================================================================
export async function triggerVeoVideo(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string; narrationText?: string; videoModel?: string | null },
    imageUrl?: string
): Promise<{ success: boolean; operationName?: string; error?: string }> {
    try {
        // 참조 이미지 준비
        let referenceImageData: { imageBytes: string; mimeType: string } | null = null;
        if (imageUrl) {
            referenceImageData = await fetchImageAsBase64(imageUrl);
        }

        const prompt = buildVideoPrompt({
            ...productInfo,
            hasReferenceImage: !!referenceImageData,
        });

        console.log(`[Veo] 영상 생성 트리거 시작`);
        const targetModel = productInfo.videoModel || VEO_MODEL;
        console.log(`[Veo] 모델: ${targetModel}`);
        console.log(`[Veo] 해상도: ${VEO_RESOLUTION}, 길이: ${VEO_DURATION}초, 비율: ${VEO_ASPECT_RATIO}`);
        console.log(`[Veo] 참조 이미지: ${referenceImageData ? '있음' : '없음 (텍스트 전용)'}`);
        console.log(`[Veo] 프롬프트: ${prompt.substring(0, 120)}...`);

        // Veo API 호출 옵션 구성
        const generateOptions: any = {
            model: targetModel,
            prompt: prompt,
            config: {
                aspectRatio: VEO_ASPECT_RATIO,
                resolution: VEO_RESOLUTION,
                durationSeconds: VEO_DURATION,
                personGeneration: 'allow_adult',
                numberOfVideos: 1,
            },
        };

        // 참조 이미지가 있으면 referenceImages로 전달 (상품 외형 보존)
        if (referenceImageData) {
            generateOptions.config.referenceImages = [
                {
                    image: {
                        imageBytes: referenceImageData.imageBytes,
                        mimeType: referenceImageData.mimeType,
                    },
                    referenceType: 'asset',
                },
            ];
            console.log(`[Veo] referenceImages에 상품 이미지 1장 첨부 (asset 타입)`);
        }

        const operation = await ai.models.generateVideos(generateOptions);

        // operation.name이 폴링에 필요한 고유 식별자
        const operationName = (operation as any).name;
        if (!operationName) {
            console.error('[Veo] operation name 없음:', JSON.stringify(operation));
            return { success: false, error: 'Operation name을 받지 못했습니다.' };
        }

        console.log(`[Veo] 영상 생성 트리거 성공, Operation: ${operationName}`);
        return { success: true, operationName };
    } catch (error) {
        console.error('[Veo] 영상 생성 트리거 오류:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// Veo 영상 생성 상태 확인 (폴링)
// ============================================================================
export async function checkVeoVideo(operationName: string): Promise<{
    status: 'running' | 'succeed' | 'failed';
    videoUri?: string;
    error?: string;
}> {
    try {
        // REST API를 사용하여 operation 상태를 폴링
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
            {
                headers: {
                    'x-goog-api-key': GOOGLE_API_KEY,
                },
            }
        );

        if (!response.ok) {
            console.error(`[Veo] 폴링 HTTP 에러: ${response.status}`);
            return { status: 'running', error: `HTTP ${response.status}` };
        }

        const data = await response.json();

        if (data.done === true) {
            // 완료 - 영상 URI 추출
            const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
            if (videoUri) {
                console.log(`[Veo] 영상 생성 완료! URI: ${videoUri.substring(0, 80)}...`);
                return { status: 'succeed', videoUri };
            }

            // 에러로 완료된 경우
            const errorMsg = data.error?.message || '영상 URI를 찾을 수 없습니다.';
            console.error(`[Veo] 영상 생성 실패:`, errorMsg);
            return { status: 'failed', error: errorMsg };
        }

        // 아직 진행 중
        console.log(`[Veo] 영상 생성 진행 중...`);
        return { status: 'running' };
    } catch (error) {
        console.error('[Veo] 폴링 오류:', error);
        return { status: 'running', error: String(error) };
    }
}

// ============================================================================
// 통합 함수 - Veo 트리거만 실행 (서버리스 타임아웃 호환)
// 실제 폴링과 다운로드는 sync/route.ts Cron Worker에서 처리
// ============================================================================
export async function generateProductVideo(
    productId: string,
    imageBase64OrUrl: string,
    productInfo: { name: string; fabric: string; gender: Gender; category?: string; narrationText?: string; videoModel?: string | null }
): Promise<void> {
    console.log(`[Veo Service] 영상 생성 트리거: ${productId} - ${productInfo.name}`);

    try {
        await productStore.updateVideoStatus(productId, 'generating', undefined, undefined, undefined, undefined, undefined, supabaseAdmin);

        // Veo 영상 생성 트리거 (API 호출 1회, 즉시 반환) - 이미지 참조 포함
        const triggerResult = await triggerVeoVideo(productInfo, imageBase64OrUrl);

        if (!triggerResult.success || !triggerResult.operationName) {
            const errorMsg = triggerResult.error || '영상 생성 트리거 실패';
            await productStore.updateVideoStatus(productId, 'failed', undefined, undefined, errorMsg, undefined, undefined, supabaseAdmin);
            throw new Error(errorMsg);
        }

        // Operation name 저장 후 즉시 반환 (폴링은 sync/route.ts에서)
        await productStore.updateVideoStatus(productId, 'generating', undefined, undefined, undefined, triggerResult.operationName, undefined, supabaseAdmin);
        console.log(`[Veo Service] 트리거 완료, 폴링은 Sync Worker에 위임: ${triggerResult.operationName}`);

    } catch (error) {
        const product = await productStore.getProduct(productId);
        if (product && product.videoStatus === 'generating') {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await productStore.updateVideoStatus(productId, 'failed', undefined, undefined, errorMsg, undefined, undefined, supabaseAdmin);
        }
        console.error(`[Veo Service] 트리거 오류:`, error);
        throw error;
    }
}

// ============================================================================
// 현재 설정된 서비스 정보
// ============================================================================
export function getAIServiceInfo(): { service: string; configured: boolean } {
    return { service: 'veo-3.1-fast', configured: !!GOOGLE_API_KEY };
}
