// AI 아바타 영상 생성 서비스 - Kling AI 연동
// 워크플로우: 1) Virtual Try-On → 2) Image-to-Video (오디오 포함)

import { productStore } from './productStore';
import type { Gender } from './types';
import jwt from 'jsonwebtoken';

// ============================================================================
// Kling AI API 설정
// ============================================================================

const KLING_ACCESS_KEY = 'AT43bEh9rHFypJENnKmGQ3aebAPQeCEk';
const KLING_SECRET_KEY = 'bHMfMmgtLP89KGLYDPG9yMpKky8JnfeJ';
const KLING_API_BASE = 'https://api-singapore.klingai.com';

// 기본 모델 이미지 (Virtual Try-On에 사용) - 성별별 모델
const MODEL_IMAGES = {
    female: 'https://res.cloudinary.com/dpaqhv0ay/image/upload/v1770710879/Gemini_Generated_Image_lqt41ilqt41ilqt4_pnxc3t.png',
    male: 'https://photo.newsen.com/news_photo/2019/10/30/201910302027111810_1.jpg'
};

// ============================================================================
// JWT 토큰 생성
// ============================================================================
function generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: KLING_ACCESS_KEY,
        exp: now + 300,
        nbf: now - 60
    };

    const token = jwt.sign(payload, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        noTimestamp: true,
        header: { alg: 'HS256', typ: 'JWT' }
    });

    return token;
}

// ============================================================================
// 공통 API 헬퍼
// ============================================================================
async function klingRequest(endpoint: string, method: string = 'GET', body?: object): Promise<object> {
    const token = generateJWT();
    const url = `${KLING_API_BASE}${endpoint}`;
    console.log(`[Kling API] ${method} ${endpoint}`);

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json();

    if ((data as { code?: number }).code !== 0) {
        console.error(`[Kling API] 에러 응답:`, JSON.stringify(data, null, 2));
    }
    return data;
}

// 작업 결과 폴링
async function pollTask(endpoint: string, maxAttempts: number = 60): Promise<{ success: boolean; data?: object; error?: string }> {
    let attempts = 0;
    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            const statusData = await klingRequest(endpoint) as {
                code?: number;
                data?: { task_status?: string; task_result?: object; task_status_msg?: string }
            };

            if (statusData.code !== 0) {
                console.warn(`[Kling] 폴링 응답 에러:`, statusData);
                attempts++;
                continue;
            }

            const status = statusData.data?.task_status;
            console.log(`[Kling] 폴링 ${attempts + 1}/${maxAttempts}: ${status} ${statusData.data?.task_status_msg || ''}`);

            if (status === 'succeed') {
                return { success: true, data: statusData.data?.task_result };
            } else if (status === 'failed') {
                return { success: false, error: statusData.data?.task_status_msg || '작업 실패' };
            }
        } catch (err) {
            console.warn(`[Kling] 폴링 네트워크 에러:`, err);
        }
        attempts++;
    }
    return { success: false, error: '시간 초과' };
}

// ============================================================================
// Base64 이미지 처리 유틸리티
// ============================================================================
function stripBase64Prefix(base64String: string): string {
    if (base64String.startsWith('data:')) {
        const commaIndex = base64String.indexOf(',');
        if (commaIndex !== -1) {
            return base64String.substring(commaIndex + 1);
        }
    }
    return base64String;
}

function isBase64Image(str: string): boolean {
    return str.startsWith('data:image');
}

// ============================================================================
// 1단계: Virtual Try-On (의류를 모델에게 입히기)
// ============================================================================
async function callVirtualTryOn(
    clothImageInput: string,
    gender: Gender
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    console.log(`[Kling] ===== 1단계: Virtual Try-On =====`);
    console.log(`[Kling] 모델: ${gender === 'female' ? '여성' : '남성'}`);
    console.log(`[Kling] 의류 이미지: ${isBase64Image(clothImageInput) ? 'Base64 (직접 전달)' : 'URL'}`);

    try {
        const clothImage = isBase64Image(clothImageInput)
            ? stripBase64Prefix(clothImageInput)
            : clothImageInput;

        const data = await klingRequest('/v1/images/kolors-virtual-try-on', 'POST', {
            model_name: 'kolors-virtual-try-on-v1-5',
            human_image: MODEL_IMAGES[gender],
            cloth_image: clothImage
        }) as { code?: number; message?: string; data?: { task_id?: string } };

        if (data.code !== 0) {
            console.error(`[Kling] Try-On 요청 실패: ${data.message}`);
            return { success: false, error: data.message || 'Virtual Try-On 요청 실패' };
        }

        const taskId = data.data?.task_id;
        if (!taskId) {
            return { success: false, error: 'task_id 없음' };
        }
        console.log(`[Kling] Try-On 작업 ID: ${taskId}`);

        // 결과 대기 (최대 3분)
        const result = await pollTask(`/v1/images/kolors-virtual-try-on/${taskId}`, 36);
        if (result.success) {
            const resultData = result.data as { images?: Array<{ url?: string }> };
            const imageUrl = resultData?.images?.[0]?.url;
            if (imageUrl) {
                console.log(`[Kling] Try-On 성공!`);
                return { success: true, imageUrl };
            }
            console.error('[Kling] Try-On 결과에 이미지 URL 없음:', JSON.stringify(result.data));
        }
        return { success: false, error: result.error || '이미지 URL 없음' };
    } catch (error) {
        console.error('[Kling] Try-On 오류:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// 2단계: Image-to-Video + 오디오 (kling-v2-6, enable_audio)
// ============================================================================
async function callImageToVideo(
    imageUrl: string,
    productInfo: { name: string; fabric: string; gender: Gender }
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
    console.log(`[Kling] ===== 2단계: Image-to-Video (오디오 포함) =====`);
    console.log(`[Kling] 입력 이미지: ${imageUrl.substring(0, 80)}...`);

    const genderText = productInfo.gender === 'female' ? '여성' : '남성';
    const prompt = `A professional ${genderText} fashion model wearing ${productInfo.name}. The model is presenting the clothing naturally in a studio with soft lighting, slowly turning to show the ${productInfo.fabric} fabric texture. The model says: "안녕하세요, 이 멋진 ${productInfo.name}을 소개합니다. ${productInfo.fabric} 소재로 제작되어 착용감이 편안합니다." High quality, 4K, professional fashion video.`;

    try {
        const data = await klingRequest('/v1/videos/image2video', 'POST', {
            model_name: 'kling-v2-6',       // 최신 모델 (오디오 지원)
            image: imageUrl,
            prompt: prompt,
            negative_prompt: 'blurry, distorted, ugly, low quality, static, deformed face, bad anatomy',
            cfg_scale: 0.5,
            mode: 'pro',                    // pro 모드 (오디오 필수)
            duration: '5',
            aspect_ratio: '9:16',           // 세로형 (모델 이미지 비율 유지)
            enable_audio: true              // 네이티브 오디오 생성
        }) as { code?: number; message?: string; data?: { task_id?: string } };

        if (data.code !== 0) {
            console.error(`[Kling] Video 생성 요청 실패: ${data.message}`);

            // kling-v2-6 실패 시 kling-v1-6으로 폴백 (오디오 없이)
            if (data.code === 1203 || data.code === 1201) {
                console.warn('[Kling] kling-v2-6 미지원 → kling-v1-6으로 재시도 (오디오 없음)');
                return await callImageToVideoFallback(imageUrl, productInfo);
            }
            return { success: false, error: data.message || 'Video 생성 요청 실패' };
        }

        const taskId = data.data?.task_id;
        if (!taskId) {
            return { success: false, error: 'task_id 없음' };
        }
        console.log(`[Kling] Video 작업 ID: ${taskId} (오디오 포함)`);

        // 결과 대기 (최대 10분)
        const result = await pollTask(`/v1/videos/image2video/${taskId}`, 120);
        if (result.success) {
            const resultData = result.data as { videos?: Array<{ url?: string }> };
            const videoUrl = resultData?.videos?.[0]?.url;
            if (videoUrl) {
                console.log(`[Kling] Video + Audio 생성 성공!`);
                return { success: true, videoUrl };
            }
            console.error('[Kling] Video 결과에 URL 없음:', JSON.stringify(result.data));
        }
        return { success: false, error: result.error || '비디오 URL 없음' };
    } catch (error) {
        console.error('[Kling] Video 오류:', error);
        return { success: false, error: String(error) };
    }
}

// kling-v2-6 실패 시 폴백 (오디오 없이)
async function callImageToVideoFallback(
    imageUrl: string,
    productInfo: { name: string; fabric: string; gender: Gender }
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
    console.log(`[Kling] === 폴백: kling-v1-6 (오디오 없음) ===`);

    const genderText = productInfo.gender === 'female' ? '여성' : '남성';
    const prompt = `A professional ${genderText} fashion model wearing ${productInfo.name}. Natural movements, turning to show ${productInfo.fabric} fabric texture. High quality, 4K, studio lighting.`;

    try {
        const data = await klingRequest('/v1/videos/image2video', 'POST', {
            model_name: 'kling-v1-6',
            image: imageUrl,
            prompt: prompt,
            negative_prompt: 'blurry, distorted, ugly, low quality, static, deformed face, bad anatomy',
            cfg_scale: 0.5,
            mode: 'pro',
            duration: '5',
            aspect_ratio: '9:16'
        }) as { code?: number; message?: string; data?: { task_id?: string } };

        if (data.code !== 0) {
            return { success: false, error: data.message || 'Video 폴백 실패' };
        }

        const taskId = data.data?.task_id;
        if (!taskId) return { success: false, error: 'task_id 없음' };
        console.log(`[Kling] 폴백 Video 작업 ID: ${taskId}`);

        const result = await pollTask(`/v1/videos/image2video/${taskId}`, 120);
        if (result.success) {
            const resultData = result.data as { videos?: Array<{ url?: string }> };
            const videoUrl = resultData?.videos?.[0]?.url;
            if (videoUrl) {
                console.log(`[Kling] 폴백 Video 생성 성공 (오디오 없음)`);
                return { success: true, videoUrl };
            }
        }
        return { success: false, error: result.error || '비디오 URL 없음' };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// 통합 함수 - 전체 워크플로우 실행
// ============================================================================
export async function generateProductVideo(
    productId: string,
    imageBase64OrUrl: string,
    productInfo: { name: string; fabric: string; gender: Gender }
): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Kling AI] 영상 생성 시작: ${productId}`);
    console.log(`[Kling AI] 상품: ${productInfo.name} (${productInfo.gender === 'female' ? '여성복' : '남성복'})`);
    console.log(`[Kling AI] 소재: ${productInfo.fabric}`);
    console.log(`[Kling AI] 워크플로우: Try-On → Image-to-Video (오디오 포함)`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        productStore.updateVideoStatus(productId, 'generating');

        // ===== 1단계: Virtual Try-On =====
        const tryOnResult = await callVirtualTryOn(imageBase64OrUrl, productInfo.gender);

        let imageForVideo: string;
        if (tryOnResult.success && tryOnResult.imageUrl) {
            imageForVideo = tryOnResult.imageUrl;
            console.log(`\n[Kling AI] 1단계 결과: 성공 - 모델에 의류 착용 완료\n`);
        } else {
            console.warn(`\n[Kling AI] 1단계 결과: 실패 (${tryOnResult.error})`);
            console.warn('[Kling AI] → Try-On 건너뛰고 원본 이미지로 영상 생성 진행\n');
            if (isBase64Image(imageBase64OrUrl)) {
                imageForVideo = stripBase64Prefix(imageBase64OrUrl);
                console.log('[Kling AI] Base64 이미지를 Image-to-Video에 직접 전달');
            } else {
                imageForVideo = imageBase64OrUrl;
            }
        }

        // ===== 2단계: Image-to-Video + 오디오 =====
        const videoResult = await callImageToVideo(imageForVideo, productInfo);

        if (videoResult.success && videoResult.videoUrl) {
            productStore.updateVideoStatus(productId, 'completed', videoResult.videoUrl);
            console.log(`\n${'='.repeat(60)}`);
            console.log(`[Kling AI] 영상 생성 완료!`);
            console.log(`[Kling AI] URL: ${videoResult.videoUrl.substring(0, 80)}...`);
            console.log(`${'='.repeat(60)}\n`);
        } else {
            productStore.updateVideoStatus(productId, 'failed');
            console.error(`\n[Kling AI] 영상 생성 실패: ${videoResult.error}\n`);
        }
    } catch (error) {
        productStore.updateVideoStatus(productId, 'failed');
        console.error(`[Kling AI] 오류:`, error);
    }
}

// 현재 설정된 서비스 정보
export function getAIServiceInfo(): { service: string; configured: boolean } {
    return { service: 'kling', configured: true };
}
