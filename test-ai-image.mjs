// 직접 AI 이미지 생성 API를 호출하여 에러를 확인하는 테스트 스크립트
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// .env.local 로드
dotenv.config({ path: '.env.local' });

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

console.log('=== 환경변수 확인 ===');
console.log('GOOGLE_CLOUD_PROJECT:', project);
console.log('GOOGLE_CLOUD_LOCATION:', location);
console.log('GOOGLE_CLIENT_EMAIL:', clientEmail);
console.log('GOOGLE_PRIVATE_KEY 존재:', !!privateKey);
console.log('GOOGLE_PRIVATE_KEY 길이:', privateKey?.length);

const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
  googleAuthOptions: {
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    }
  }
});

// 테스트 이미지 URL (실패한 상품의 이미지)
const testImageUrl = 'https://res.cloudinary.com/dpaqhv0ay/image/upload/v1774948455/products/tvd69hpz9g679ounrvxx.webp';

async function testImageGeneration() {
  console.log('\n=== 테스트 1: 참조 이미지 다운로드 ===');
  try {
    const response = await fetch(testImageUrl, { redirect: 'follow' });
    console.log('HTTP 상태:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('이미지 크기:', Math.round(arrayBuffer.byteLength / 1024), 'KB');
    console.log('Base64 길이:', base64.length);
    
    const mimeType = response.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
    
    console.log('\n=== 테스트 2: Gemini 이미지 생성 API 호출 ===');
    console.log('모델: gemini-2.0-flash-exp');
    
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          'Take this product photo and enhance it into a professional e-commerce product image with a clean white studio background.',
          {
            inlineData: {
              mimeType: mimeType,
              data: base64
            }
          }
        ],
        config: {
          responseModalities: ['IMAGE'],
        }
      });
      
      console.log('API 응답 수신!');
      console.log('promptFeedback:', JSON.stringify((result).promptFeedback, null, 2));
      console.log('candidates 수:', result.candidates?.length);
      if (result.candidates?.[0]) {
        console.log('finishReason:', result.candidates[0].finishReason);
        console.log('parts 수:', result.candidates[0].content?.parts?.length);
        const hasImage = result.candidates[0].content?.parts?.some(p => p.inlineData?.data);
        console.log('이미지 데이터 포함:', hasImage);
      }
    } catch (apiError) {
      console.error('\n!!! API 호출 에러 !!!');
      console.error('에러 타입:', apiError.constructor.name);
      console.error('메시지:', apiError.message);
      console.error('상태 코드:', apiError.status || apiError.code || 'N/A');
      if (apiError.response) {
        console.error('응답 본문:', JSON.stringify(apiError.response, null, 2));
      }
      console.error('전체 에러:', JSON.stringify(apiError, null, 2));
    }

    console.log('\n=== 테스트 3: gemini-3.1-flash-image-preview 모델 테스트 ===');
    try {
      const result2 = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [
          'Take this product photo and enhance it into a professional e-commerce product image with a clean white studio background.',
          {
            inlineData: {
              mimeType: mimeType,
              data: base64
            }
          }
        ],
        config: {
          responseModalities: ['IMAGE'],
        }
      });
      
      console.log('API 응답 수신!');
      console.log('candidates 수:', result2.candidates?.length);
      if (result2.candidates?.[0]) {
        console.log('finishReason:', result2.candidates[0].finishReason);
        const hasImage = result2.candidates[0].content?.parts?.some(p => p.inlineData?.data);
        console.log('이미지 데이터 포함:', hasImage);
      }
    } catch (apiError) {
      console.error('\n!!! gemini-3.1-flash-image-preview 에러 !!!');
      console.error('에러 타입:', apiError.constructor.name);
      console.error('메시지:', apiError.message);
      console.error('상태 코드:', apiError.status || apiError.code || 'N/A');
    }

    console.log('\n=== 테스트 4: 텍스트 전용 모델 호출 (인증 확인) ===');
    try {
      const textResult = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Say hello in Korean. Just one word.',
      });
      console.log('텍스트 응답:', textResult.text);
    } catch (textError) {
      console.error('텍스트 API 에러:', textError.message);
    }
    
  } catch (fetchErr) {
    console.error('이미지 다운로드 실패:', fetchErr);
  }
}

testImageGeneration().catch(console.error);
