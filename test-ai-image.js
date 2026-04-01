// 직접 AI 이미지 생성 API를 호출하여 에러를 확인하는 테스트 스크립트
const { GoogleGenAI } = require('@google/genai');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// .env.local 수동 파싱
const envPath = resolve(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
let currentKey = null;
let currentValue = '';
let inMultiline = false;

for (const line of envContent.split('\n')) {
  if (inMultiline) {
    currentValue += '\n' + line;
    if (line.includes('"')) {
      inMultiline = false;
      env[currentKey] = currentValue.replace(/^"|"$/g, '');
      currentKey = null;
      currentValue = '';
    }
    continue;
  }
  
  if (line.startsWith('#') || !line.trim()) continue;
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  
  const key = line.substring(0, eqIdx).trim();
  let value = line.substring(eqIdx + 1).trim();
  
  if (value.startsWith('"') && !value.endsWith('"')) {
    inMultiline = true;
    currentKey = key;
    currentValue = value;
    continue;
  }
  
  env[key] = value.replace(/^"|"$/g, '');
}

const project = env['GOOGLE_CLOUD_PROJECT'];
const location = env['GOOGLE_CLOUD_LOCATION'] || 'us-central1';
const clientEmail = env['GOOGLE_CLIENT_EMAIL'];
const privateKey = env['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

console.log('=== 환경변수 확인 ===');
console.log('GOOGLE_CLOUD_PROJECT:', project);
console.log('GOOGLE_CLOUD_LOCATION:', location);
console.log('GOOGLE_CLIENT_EMAIL:', clientEmail);
console.log('GOOGLE_PRIVATE_KEY 존재:', !!privateKey);
console.log('GOOGLE_PRIVATE_KEY 앞 50자:', privateKey?.substring(0, 50));

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

const testImageUrl = 'https://res.cloudinary.com/dpaqhv0ay/image/upload/v1774948455/products/tvd69hpz9g679ounrvxx.webp';

async function main() {
  // Step 1: 이미지 다운로드
  console.log('\n=== Step 1: 참조 이미지 다운로드 ===');
  const response = await fetch(testImageUrl, { redirect: 'follow' });
  console.log('HTTP 상태:', response.status);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  console.log('이미지 크기:', Math.round(arrayBuffer.byteLength / 1024), 'KB');
  const mimeType = contentType.split(';')[0].trim();
  console.log('MIME:', mimeType);

  // Step 2: 인증 확인 (텍스트)
  console.log('\n=== Step 2: 텍스트 모델로 인증 확인 ===');
  try {
    const textResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say hello in Korean. Just one word.',
    });
    console.log('텍스트 응답:', textResult.text);
    console.log('>>> Vertex AI 인증 성공!');
  } catch (e) {
    console.error('!!! 인증 실패:', e.message);
    return;
  }

  // Step 3: 현재 사용 모델 테스트
  console.log('\n=== Step 3: gemini-3.1-flash-image-preview ===');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        'A clean white studio product photo of a navy dress.',
        { inlineData: { mimeType, data: base64 } }
      ],
      config: { responseModalities: ['IMAGE'] }
    });
    console.log('>>> 성공! finishReason:', r.candidates?.[0]?.finishReason);
    const hasImg = r.candidates?.[0]?.content?.parts?.some(p => p.inlineData?.data);
    console.log('이미지 포함:', hasImg);
  } catch (e) {
    console.error('!!! 실패:', e.message);
    if (e.errorDetails) console.error('details:', JSON.stringify(e.errorDetails));
  }

  // Step 4: gemini-2.0-flash-exp
  console.log('\n=== Step 4: gemini-2.0-flash-exp ===');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        'A clean white studio product photo of a navy dress.',
        { inlineData: { mimeType, data: base64 } }
      ],
      config: { responseModalities: ['IMAGE'] }
    });
    console.log('>>> 성공! finishReason:', r.candidates?.[0]?.finishReason);
    const hasImg = r.candidates?.[0]?.content?.parts?.some(p => p.inlineData?.data);
    console.log('이미지 포함:', hasImg);
  } catch (e) {
    console.error('!!! 실패:', e.message);
    if (e.errorDetails) console.error('details:', JSON.stringify(e.errorDetails));
  }

  // Step 5: imagen
  console.log('\n=== Step 5: imagen-3.0-generate-002 ===');
  try {
    const r = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'A professional e-commerce product photo of a navy blue dress on a clean white studio background',
      config: { numberOfImages: 1 }
    });
    console.log('>>> 성공! 이미지 수:', r.generatedImages?.length);
  } catch (e) {
    console.error('!!! 실패:', e.message);
  }
}

main().catch(e => console.error('FATAL:', e));
