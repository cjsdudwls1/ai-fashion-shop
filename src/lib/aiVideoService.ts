// AI 동영상 생성 서비스 - Google Veo 3.1 Fast
// 워크플로우: 상품 이미지 참조 + 텍스트 프롬프트 → 동영상+오디오 생성

import { ai } from './genaiClient';
import { GenerateVideosOperation } from '@google/genai';
import { getCategoryEnglish, isClothingCategory } from './constants';
import { fetchImageAsBase64 } from './mediaUtils';
import type { Gender } from './types';

// ============================================================================
// Veo 모델 및 기본 설정
// ============================================================================

const VEO_MODEL = 'veo-3.1-fast-generate-preview';
const VEO_RESOLUTION = '1080p'; // Veo 3.1 Fast / Veo 3.1 모두 1080p 지원
const VEO_DURATION = 8; // Veo는 4, 6, 8초만 지원
const VEO_ASPECT_RATIO = '16:9';

// ============================================================================
// 프롬프트 생성 유틸리티
// ============================================================================

function buildVideoPrompt(productInfo: {
    name: string;
    fabric: string;
    gender: Gender;
    category?: string;
    hasReferenceImage?: boolean;
    narrationText?: string;
}): string {
    const genderStr = productInfo.gender === 'female' ? 'female' : 'male';
    const categoryStr = getCategoryEnglish(productInfo.category || '');

    // 나레이션 대사 결정: 사용자 입력이 있으면 사용, 없으면 자동 생성
    const narration = productInfo.narrationText
        ? productInfo.narrationText
        : `${productInfo.name}. ${productInfo.fabric} 소재의 프리미엄 ${categoryStr}입니다.`;

    // [2026-03-05] 의류/비의류 프롬프트 분기
    // 사유: 주얼리/액세서리는 모델이 걷는 장면보다 클로즈업 회전/디테일 촬영이 자연스러움.
    // Veo 공식 가이드의 Subject/Action/Camera 구조에 맞춰 분기 처리.
    // 근거: .docs/jewelry-category-unsupported-analysis.md 해결책 B-4
    const isClothing = isClothingCategory(productInfo.category || '');

    if (productInfo.hasReferenceImage) {
        // 참조 이미지가 있을 때
        if (isClothing) {
            return `A high-end fashion commercial video. A professional ${genderStr} model wearing the exact garment shown in the reference image - "${productInfo.name}", made of ${productInfo.fabric}. The model must wear this specific ${categoryStr} from the reference image, preserving the exact color, pattern, and design details. The model walks confidently in a modern minimalist studio with soft cinematic lighting, turns to show the garment details, and poses elegantly. Camera slowly orbits around the model. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional fashion video. Do not render any text, titles, subtitles, or watermarks on screen.`;
        }
        return `A high-end product commercial video showcasing "${productInfo.name}", a premium ${productInfo.fabric} ${categoryStr} shown in the reference image. The ${categoryStr} is displayed on an elegant surface or held by a ${genderStr} model's hands. Camera slowly orbits around the ${categoryStr} with extreme close-up detail shots, capturing the texture, shine, and craftsmanship. Soft cinematic lighting with subtle reflections. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional product video. Do not render any text, titles, subtitles, or watermarks on screen.`;
    }

    // 참조 이미지가 없을 때: 텍스트 전용 프롬프트
    if (isClothing) {
        return `A high-end fashion commercial video. A professional ${genderStr} model wearing "${productInfo.name}", a premium ${productInfo.fabric} ${categoryStr}. The model walks confidently in a modern minimalist studio with soft cinematic lighting, turns to show the garment details, and poses elegantly. Camera slowly orbits around the model. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional fashion video. Do not render any text, titles, subtitles, or watermarks on screen.`;
    }
    return `A high-end product commercial video showcasing "${productInfo.name}", a premium ${productInfo.fabric} ${categoryStr}. The ${categoryStr} is displayed on an elegant surface or held by a ${genderStr} model's hands. Camera slowly orbits around the ${categoryStr} with extreme close-up detail shots, capturing the texture, shine, and craftsmanship. Soft cinematic lighting with subtle reflections. The narrator says in Korean: "${narration}" Soft ambient background music plays. Ultra high quality, cinematic, 4K look, professional product video. Do not render any text, titles, subtitles, or watermarks on screen.`;
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
            referenceImageData = await fetchImageAsBase64(imageUrl, '[Veo]');
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            (generateOptions.config as Record<string, unknown>).referenceImages = [
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
        // DB에 operation name 문자열만 저장하므로, 폴링 시 GenerateVideosOperation 인스턴스를
        // 재구성하여 SDK의 getVideosOperation()에 전달한다.
        // 근거: .docs/veo-polling-fromAPIResponse-solution.md
        const operationName = (operation as { name?: string }).name;
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
// [2026-03-06] SDK 공식 메서드 전환
// 이전: REST API 직접 호출 + API 키 수동 주입 (veoFetch 헬퍼)
// 이후: ai.operations.getVideosOperation() — SDK 내부 인증/에러 처리 활용
// 사유: REST 직접 호출이 generativelanguage.googleapis.com에 대한 API 호출로
//       집계되어 과금 폭증의 주범이었음. SDK 공식 메서드는 operation 조회를
//       내부적으로 최적화하여 불필요한 과금을 방지한다.
// 근거: https://ai.google.dev/gemini-api/docs/video#handling-asynchronous-operations
// ============================================================================
export async function checkVeoVideo(operationName: string): Promise<{
    status: 'running' | 'succeed' | 'failed';
    videoUri?: string;
    error?: string;
}> {
    try {
        // [2026-03-08] GenerateVideosOperation 인스턴스 복원
        // SDK의 getVideosOperation()은 _fromAPIResponse() 메서드를 가진
        // 클래스 인스턴스를 요구한다. DB에는 operationName 문자열만 저장하므로
        // 빈 인스턴스를 생성하고 name만 설정하여 전달한다.
        // 근거: .docs/veo-polling-fromAPIResponse-solution.md
        const operationRef = new GenerateVideosOperation();
        operationRef.name = operationName;
        const operation = await ai.operations.getVideosOperation({
            operation: operationRef,
        });

        if (operation.done) {
            // SDK 응답 구조: response.generatedVideos[].video.uri
            const videos = operation.response?.generatedVideos;

            if (videos && videos.length > 0) {
                const videoUri = videos[0].video?.uri;
                if (videoUri) {
                    console.log(`[Veo] 영상 생성 완료! URI: ${videoUri.substring(0, 80)}...`);
                    return { status: 'succeed', videoUri };
                }
            }

            // 에러로 완료된 경우 또는 응답 구조가 예상과 다른 경우
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMsg = (operation as any).error?.message || '영상 URI를 찾을 수 없습니다.';
            console.error(`[Veo] 영상 생성 실패:`, errorMsg);
            return { status: 'failed', error: errorMsg };
        }

        // 아직 진행 중
        console.log(`[Veo] 영상 생성 진행 중...`);
        return { status: 'running' };
    } catch (error) {
        // 네트워크 예외도 'failed'로 반환하여 에러 마스킹 제거
        console.error('[Veo] 폴링 오류:', error);
        return { status: 'failed', error: String(error) };
    }
}

// ============================================================================
// Veo 영상 다운로드 (ArrayBuffer 반환)
// SDK 응답의 videoUri를 사용하여 다운로드
// ============================================================================
export async function downloadVeoVideo(videoUri: string): Promise<ArrayBuffer> {
    console.log(`[Veo] 영상 다운로드 시작: ${videoUri.substring(0, 80)}...`);

    // Vertex AI 모드: SDK가 서명된(인증 토큰 포함) URL을 반환하므로 직접 fetch만 수행
    const response = await fetch(videoUri, { redirect: 'follow' });

    if (!response.ok) {
        throw new Error(`영상 다운로드 실패: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log(`[Veo] 응답 Content-Type: ${contentType}`);

    const arrayBuffer = await response.arrayBuffer();
    console.log(`[Veo] 영상 다운로드 완료 (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);

    return arrayBuffer;
}
