
import { NextResponse } from 'next/server';
import { generateTTS } from '@/lib/ttsService';
import type { Gender } from '@/lib/types';

// POST: TTS 생성 후 오디오 파일 직접 반환 (브라우저에서 재생 가능)
export async function POST(request: Request) {
    try {
        const body = await request.json() as {
            text?: string;
            gender?: Gender;
        };

        const text = body.text || '안녕하세요, AI 패션샵에 오신 것을 환영합니다.';
        const gender = body.gender || 'female';

        const result = await generateTTS(text, gender);

        if (result.success && result.audioBase64 && result.mimeType) {
            // Base64를 버퍼로 변환하여 오디오 파일로 직접 응답
            const audioBuffer = Buffer.from(result.audioBase64, 'base64');

            return new NextResponse(audioBuffer, {
                status: 200,
                headers: {
                    'Content-Type': result.mimeType,
                    'Content-Length': audioBuffer.length.toString(),
                    'Content-Disposition': 'inline; filename="tts-output.mp3"',
                }
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
