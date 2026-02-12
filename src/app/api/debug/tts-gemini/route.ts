
import { NextResponse } from 'next/server';
import { generateTTS, getAvailableVoices } from '@/lib/ttsService';
import type { Gender } from '@/lib/types';

// POST: TTS 음성 생성 테스트
export async function POST(request: Request) {
    try {
        const body = await request.json() as {
            text?: string;
            voice?: string;
            gender?: Gender;
        };

        const text = body.text || '안녕하세요, AI 패션샵에 오신 것을 환영합니다.';
        const gender = body.gender || 'female';

        console.log('[Debug ElevenLabs TTS] 요청:', { text, gender });

        const result = await generateTTS(text, gender);

        if (result.success && result.audioBase64) {
            return NextResponse.json({
                success: true,
                mimeType: result.mimeType,
                audioSize: Math.round(result.audioBase64.length / 1024) + 'KB',
                audioDataUrl: `data:${result.mimeType};base64,${result.audioBase64}`,
                message: 'ElevenLabs TTS 생성 성공!'
            });
        }

        return NextResponse.json({
            success: false,
            error: result.error
        }, { status: 500 });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// GET: 사용 가능한 음성 목록
export async function GET() {
    return NextResponse.json({
        provider: 'ElevenLabs',
        model: 'eleven_multilingual_v2',
        voices: getAvailableVoices(),
        usage: {
            POST: {
                body: {
                    text: '변환할 텍스트 (기본: 환영 멘트)',
                    gender: 'female | male (기본: female)',
                },
                description: 'ElevenLabs TTS 음성 생성 테스트'
            }
        }
    });
}
