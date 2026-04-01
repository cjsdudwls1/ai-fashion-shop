const { GoogleGenAI } = require('@google/genai');
const { readFileSync, writeFileSync } = require('fs');

const log = [];
function L(msg) { log.push(msg); console.log(msg); }

// parse .env.local
const raw = readFileSync('.env.local', 'utf-8');
const envVars = {};
const lines = raw.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('#')) continue;
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  const key = line.substring(0, eqIdx).trim();
  let value = line.substring(eqIdx + 1);
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

const pk = envVars['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

L('PK length: ' + pk?.length);
L('PK starts with BEGIN: ' + pk?.startsWith('-----BEGIN'));
L('PK line count: ' + pk?.split('\n').length);

const ai = new GoogleGenAI({
  vertexai: true,
  project: envVars['GOOGLE_CLOUD_PROJECT'],
  location: envVars['GOOGLE_CLOUD_LOCATION'] || 'us-central1',
  googleAuthOptions: {
    credentials: {
      client_email: envVars['GOOGLE_CLIENT_EMAIL'],
      private_key: pk,
    }
  }
});

async function test() {
  // Test 1: text auth
  L('\n--- Test 1: Text gen (auth check) ---');
  try {
    const r = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Say hello' });
    L('SUCCESS: ' + r.text);
  } catch (e) {
    L('FAIL: ' + e.message);
    L('This is an AUTH problem. Stopping.');
    writeFileSync('test-result-en.txt', log.join('\n'), 'utf8');
    return;
  }

  // Test 2: image download
  L('\n--- Test 2: Image download ---');
  const imgUrl = 'https://res.cloudinary.com/dpaqhv0ay/image/upload/v1774948455/products/tvd69hpz9g679ounrvxx.webp';
  const resp = await fetch(imgUrl);
  const buf = await resp.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  const mime = resp.headers.get('content-type')?.split(';')[0] || 'image/webp';
  L('Image size: ' + Math.round(buf.byteLength / 1024) + 'KB, MIME: ' + mime);

  // Test 3: gemini-3.1-flash-image-preview
  L('\n--- Test 3: gemini-3.1-flash-image-preview ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: ['A studio product photo', { inlineData: { mimeType: mime, data: b64 } }],
      config: { responseModalities: ['IMAGE'] }
    });
    L('SUCCESS! finishReason: ' + r.candidates?.[0]?.finishReason);
    L('Has image: ' + !!r.candidates?.[0]?.content?.parts?.find(p => p.inlineData));
  } catch (e) {
    L('FAIL: ' + e.message?.substring(0, 500));
  }

  // Test 4: gemini-2.0-flash-exp
  L('\n--- Test 4: gemini-2.0-flash-exp ---');
  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: ['A studio product photo', { inlineData: { mimeType: mime, data: b64 } }],
      config: { responseModalities: ['IMAGE'] }
    });
    L('SUCCESS! finishReason: ' + r.candidates?.[0]?.finishReason);
    L('Has image: ' + !!r.candidates?.[0]?.content?.parts?.find(p => p.inlineData));
  } catch (e) {
    L('FAIL: ' + e.message?.substring(0, 500));
  }

  writeFileSync('test-result-en.txt', log.join('\n'), 'utf8');
}

test().catch(e => { L('FATAL: ' + e.message); writeFileSync('test-result-en.txt', log.join('\n'), 'utf8'); });
