
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const KLING_ACCESS_KEY = 'AT43bEh9rHFypJENnKmGQ3aebAPQeCEk';
const KLING_SECRET_KEY = 'bHMfMmgtLP89KGLYDPG9yMpKky8JnfeJ';
const KLING_API_BASE = 'https://api-singapore.klingai.com';

function generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: KLING_ACCESS_KEY,
        exp: now + 300,
        nbf: now - 60
    };

    const token = jwt.sign(payload, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        noTimestamp: true,
        header: { alg: 'HS256', typ: 'JWT' }
    });

    return token;
}

export async function GET() {
    try {
        const token = generateJWT();
        // preset voices
        const response = await fetch(`${KLING_API_BASE}/v1/general/presets-voices`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
