// ElevenLabs TTS 서비스
// ElevenLabs REST API를 사용하여 텍스트를 음성으로 변환
// MP3 포맷으로 직접 반환하므로 별도의 WAV 변환 불필요

import type { Gender } from './types';

// ============================================================================
// ElevenLabs TTS 설정
// ============================================================================

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_MODEL = 'eleven_multilingual_v2'; // 한국어 포함 29개 언어 지원

// 음성 ID (성별에 따라 다른 음성 사용)
// ElevenLabs 기본 제공 음성 (premade voices)
const VOICE_OPTIONS: Record<string, { id: string; name: string }> = {
    female: { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },    // 명확하고 교육적인 여성 음성
    male: { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },      // 따뜻하고 매력적인 남성 음성
    neutral: { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },    // 편안하고 중립적인 음성
};

// ============================================================================
// 상품 설명 나레이션 텍스트 생성
// ============================================================================

export function generateNarrationText(
    productInfo: { name: string; fabric: string; gender: Gender }
): string {
    const genderText = productInfo.gender === 'female' ? '여성' : '남성';

    // 짧고 세련된 5초 분량의 나레이션 (약 40~60자)
    const narrations = [
        `${productInfo.name}. ${productInfo.fabric} 소재의 프리미엄 ${genderText} 패션입니다.`,
        `${productInfo.fabric} 소재로 완성한 ${productInfo.name}. 세련된 ${genderText} 룩을 만나보세요.`,
        `프리미엄 ${productInfo.fabric} 소재, ${productInfo.name}. ${genderText}을 위한 특별한 스타일.`,
    ];

    // 랜덤 선택
    return narrations[Math.floor(Math.random() * narrations.length)];
}

// ============================================================================
// ElevenLabs TTS API 호출
// ============================================================================

export interface TTSResult {
    success: boolean;
    audioBase64?: string;       // Base64 인코딩된 MP3 오디오 데이터
    mimeType?: string;          // audio/mpeg
    error?: string;
}

export async function generateTTS(
    text: string,
    gender: Gender = 'female'
): Promise<TTSResult> {
    const voice = VOICE_OPTIONS[gender] || VOICE_OPTIONS.female;

    console.log(`[ElevenLabs TTS] ===== TTS 음성 생성 시작 =====`);
    console.log(`[ElevenLabs TTS] 텍스트: ${text}`);
    console.log(`[ElevenLabs TTS] 음성: ${voice.name} (${voice.id})`);
    console.log(`[ElevenLabs TTS] 모델: ${ELEVENLABS_MODEL}`);

    try {
        const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voice.id}?output_format=mp3_44100_128`;

        const requestBody = {
            text: text,
            model_id: ELEVENLABS_MODEL,
            language_code: 'ko',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true,
                speed: 1.0,
            }
        };

        console.log(`[ElevenLabs TTS] API 요청 중...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ElevenLabs TTS] HTTP 에러 ${response.status}: ${errorText}`);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }

        // ElevenLabs는 직접 MP3 바이너리를 반환
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        console.log(`[ElevenLabs TTS] 오디오 생성 완료! MP3 크기: ${Math.round(audioBase64.length / 1024)}KB (Base64)`);

        return {
            success: true,
            audioBase64: audioBase64,
            mimeType: 'audio/mpeg'
        };

    } catch (error) {
        console.error('[ElevenLabs TTS] 오류:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// 상품 나레이션 TTS 생성 (통합 함수)
// ============================================================================

export async function generateProductNarration(
    productInfo: { name: string; fabric: string; gender: Gender }
): Promise<TTSResult> {
    const narrationText = generateNarrationText(productInfo);
    console.log(`[ElevenLabs TTS] 상품 나레이션 생성: "${narrationText}"`);
    return await generateTTS(narrationText, productInfo.gender);
}

// ============================================================================
// 오디오 데이터를 Data URL로 변환
// ============================================================================

export function audioToDataUrl(audioBase64: string, mimeType: string): string {
    return `data:${mimeType};base64,${audioBase64}`;
}

// ============================================================================
// 사용 가능한 음성 목록 반환
// ============================================================================

export function getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
    return [
        { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: '여성 음성 - 명확하고 교육적인 톤 (영국 억양)' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: '여성 음성 - 성숙하고 신뢰감 있는 톤' },
        { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: '여성 음성 - 밝고 따뜻한 톤' },
        { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: '여성 음성 - 우아하고 세련된 톤 (영국 억양)' },
        { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', description: '여성 음성 - 전문적이고 밝은 톤' },
        { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: '남성 음성 - 따뜻하고 매력적인 스토리텔러 (영국 억양)' },
        { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: '남성 음성 - 부드럽고 신뢰감 있는 톤' },
        { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: '남성 음성 - 깊고 편안한 톤' },
        { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: '남성 음성 - 안정적인 방송 스타일 (영국 억양)' },
        { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: '중성 음성 - 편안하고 중립적인 톤' },
    ];
}
