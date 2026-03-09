// GoogleGenAI 싱글톤 인스턴스
// aiVideoService.ts와 aiImageService.ts에서 공유하여 중복 생성을 방지한다.

import { GoogleGenAI } from '@google/genai';

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
    apiKey: GOOGLE_API_KEY,
    httpOptions: {
        timeout: 120_000, // 2분 (2K 이미지 생성 시 처리 시간 고려)
    }
});
// GOOGLE_API_KEY는 ai 인스턴스 내부에서만 사용 (외부 참조 없음)
