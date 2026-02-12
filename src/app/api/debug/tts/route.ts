
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY || '';
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY || '';
const KLING_API_BASE = 'https://api-singapore.klingai.com';

function generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: KLING_ACCESS_KEY,
        exp: now + 300,
        nbf: now - 60
    };

    return jwt.sign(payload, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        noTimestamp: true,
        header: { alg: 'HS256', typ: 'JWT' }
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const token = generateJWT();

        console.log('[Debug TTS] Request:', body);

        const response = await fetch(`${KLING_API_BASE}/v1/audio/tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                text: body.text || "안녕하세요 이것은 한국어 테스트입니다.",
                voice_id: body.voice_id || "829836818102231083", // Owen (Preset)
                voice_language: body.language || "ko", // 한국어 시도
                voice_speed: 1.0
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
