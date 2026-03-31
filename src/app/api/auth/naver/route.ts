import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { origin } = new URL(request.url);
    const clientId = process.env.NAVER_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.redirect(`${origin}/login?error=naver_not_configured`);
    }

    // Redirect URI matches the callback route
    const redirectUri = encodeURIComponent(`${origin}/api/auth/naver/callback`);
    
    // Generate a secure state token
    const state = crypto.randomUUID();
    
    // Naver OAuth 2.0 authorization URL
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    
    return NextResponse.redirect(naverAuthUrl);
}
