// Private Key 형식 및 인증 디버깅
const { GoogleGenAI } = require('@google/genai');
const { readFileSync } = require('fs');

// .env.local에서 GOOGLE_PRIVATE_KEY 추출
const raw = readFileSync('.env.local', 'utf-8');

// 환경변수 파싱 - 멀티라인 값 지원
const envVars = {};
const lines = raw.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('#')) continue;
  
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  
  const key = line.substring(0, eqIdx).trim();
  let value = line.substring(eqIdx + 1);
  
  // 따옴표로 시작하고 같은 줄에 닫는 따옴표가 없으면 멀티라인
  if (value.startsWith('"') && !value.slice(1).includes('"')) {
    let fullValue = value;
    while (++i < lines.length) {
      fullValue += '\n' + lines[i];
      if (lines[i].includes('"')) break;
    }
    value = fullValue;
  }
  
  envVars[key] = value.replace(/^"|"$/g, '').trim();
}

const pk = envVars['GOOGLE_PRIVATE_KEY'];

console.log('=== Private Key 분석 ===');
console.log('길이:', pk?.length);
console.log('\\n 문자열 포함:', pk?.includes('\\n'));
console.log('실제 개행 포함:', pk?.includes('\n'));  
console.log('BEGIN 시작:', pk?.startsWith('-----BEGIN'));

// 방법 1: \n 문자열 → 실제 개행으로 변환
const pk1 = pk?.replace(/\\n/g, '\n');
console.log('\n방법 1 (\\n → newline):');
console.log('줄 수:', pk1?.split('\n').length);
console.log('첫 줄:', pk1?.split('\n')[0]);
console.log('마지막 줄:', pk1?.split('\n').slice(-1)[0]);

// 테스트: 인증
console.log('\n=== Vertex AI 인증 테스트 ===');
const ai = new GoogleGenAI({
  vertexai: true,
  project: envVars['GOOGLE_CLOUD_PROJECT'],
  location: envVars['GOOGLE_CLOUD_LOCATION'] || 'us-central1',
  googleAuthOptions: {
    credentials: {
      client_email: envVars['GOOGLE_CLIENT_EMAIL'],
      private_key: pk1,
    }
  }
});

async function test() {
  // 텍스트 생성 테스트 (인증 확인)
  console.log('\n--- 텍스트 생성 테스트 (gemini-2.0-flash) ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say "hello" in Korean',
    });
    console.log('텍스트 성공:', r.text);
  } catch (e) {
    console.error('텍스트 실패:', e.message);
    console.error('  → 이것은 Vertex AI 인증 문제입니다');
    return;
  }
  
  // 이미지 생성 테스트
  console.log('\n--- 이미지 다운로드 ---');
  const imgUrl = 'https://res.cloudinary.com/dpaqhv0ay/image/upload/v1774948455/products/tvd69hpz9g679ounrvxx.webp';
  const resp = await fetch(imgUrl);
  const buf = await resp.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  const mime = resp.headers.get('content-type')?.split(';')[0] || 'image/webp';
  console.log('이미지 크기:', Math.round(buf.byteLength / 1024), 'KB, MIME:', mime);

  // 모델 1: gemini-3.1-flash-image-preview
  console.log('\n--- gemini-3.1-flash-image-preview 이미지 생성 ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: ['A professional studio photo of this dress on white background', { inlineData: { mimeType: mime, data: b64 } }],
      config: { responseModalities: ['IMAGE'] }
    });
    console.log('성공! finishReason:', r.candidates?.[0]?.finishReason);
    console.log('이미지 데이터:', !!r.candidates?.[0]?.content?.parts?.find(p => p.inlineData));
  } catch (e) {
    console.error('실패:', e.message?.substring(0, 300));
  }
  
  // 모델 2: gemini-2.0-flash-exp
  console.log('\n--- gemini-2.0-flash-exp 이미지 생성 ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: ['A professional studio photo of this dress on white background', { inlineData: { mimeType: mime, data: b64 } }],
      config: { responseModalities: ['IMAGE'] }
    });
    console.log('성공! finishReason:', r.candidates?.[0]?.finishReason);
    console.log('이미지 데이터:', !!r.candidates?.[0]?.content?.parts?.find(p => p.inlineData));
  } catch (e) {
    console.error('실패:', e.message?.substring(0, 300));
  }

  // 모델 3: gemini-2.5-flash-preview-04-17 (latest stable)
  console.log('\n--- gemini-2.5-flash-preview-04-17 이미지 생성 ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: ['A professional studio photo of this dress on white background', { inlineData: { mimeType: mime, data: b64 } }],
      config: { responseModalities: ['IMAGE', 'TEXT'] }
    });
    console.log('성공! finishReason:', r.candidates?.[0]?.finishReason);
    console.log('이미지 데이터:', !!r.candidates?.[0]?.content?.parts?.find(p => p.inlineData));
    if (r.text) console.log('텍스트:', r.text.substring(0, 100));
  } catch (e) {
    console.error('실패:', e.message?.substring(0, 300));
  }
}

test().catch(e => console.error('FATAL:', e.message));
