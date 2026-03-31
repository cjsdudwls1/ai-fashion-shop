// src/lib/genaiClient.ts
import { GoogleGenAI } from '@google/genai';

// 환경 변수 로드 상태 체크 (디버깅 용이)
if (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
  console.warn("⚠️ Vertex AI 구동을 위한 필수 환경 변수가 누락되었습니다. (.env.local 확인)");
}

export const ai = new GoogleGenAI({
  // Vertex AI 모드 활성화
  vertexai: true,
  
  // 프로젝트 및 리전 지정
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  
  // 서비스 계정 키를 직접 주입 (명시적 인증 방식)
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // 중요: Vercel/Netlify 배치 시 환경변수의 \n 문자가 이중 이스케이프(\\n)되는 흔한 버그를 방지
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  }
});
