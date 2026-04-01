const { GoogleGenAI } = require('@google/genai');
const { readFileSync, writeFileSync } = require('fs');

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
    while (++i < lines.length) { fullValue += '\n' + lines[i]; if (lines[i].includes('"')) break; }
    value = fullValue;
  }
  envVars[key] = value.replace(/^"|"$/g, '').trim();
}

const pk = envVars['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');
const out = [];

// Test multiple model names
const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001', 
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-2.5-flash-preview-04-17',
];

async function testModel(ai, model) {
  try {
    const r = await ai.models.generateContent({ model, contents: 'Say hi' });
    return 'OK: ' + (r.text || '').substring(0, 30);
  } catch (e) {
    return 'ERR: ' + (e.message || '').substring(0, 80);
  }
}

async function main() {
  const ai = new GoogleGenAI({
    vertexai: true, project: envVars['GOOGLE_CLOUD_PROJECT'],
    location: envVars['GOOGLE_CLOUD_LOCATION'] || 'us-central1',
    googleAuthOptions: { credentials: { client_email: envVars['GOOGLE_CLIENT_EMAIL'], private_key: pk } }
  });

  for (const m of models) {
    const result = await testModel(ai, m);
    const line = m + ' -> ' + result;
    out.push(line);
    console.log(line);
  }

  // Also try without vertexai (direct API) for comparison
  out.push('\n--- Without vertexai (direct API key not available, skip) ---');

  writeFileSync('test-models.txt', out.join('\n'), 'utf8');
}
main();
