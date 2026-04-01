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
    while (++i < lines.length) {
      fullValue += '\n' + lines[i];
      if (lines[i].includes('"')) break;
    }
    value = fullValue;
  }
  envVars[key] = value.replace(/^"|"$/g, '').trim();
}

const pk = envVars['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

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
  try {
    const r = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Say hello' });
    writeFileSync('test-result3.txt', 'SUCCESS: ' + r.text, 'utf8');
  } catch (e) {
    // Write the FULL error message
    writeFileSync('test-result3.txt', 'FULL_ERROR:\n' + e.message + '\n\nSTRINGIFY:\n' + JSON.stringify(e, null, 2), 'utf8');
  }
}

test();
