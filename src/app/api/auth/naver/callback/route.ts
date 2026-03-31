import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/lib/authUtils';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !state) {
        return NextResponse.redirect(`${origin}/login?error=naver_auth_failed`);
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
         return NextResponse.redirect(`${origin}/login?error=naver_not_configured`);
    }

    try {
        // 1. Get Access Token
        const tokenResponse = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`);
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            return NextResponse.redirect(`${origin}/login?error=naver_token_failed`);
        }

        // 2. Get User Profile
        const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profileData = await profileResponse.json();

        if (profileData.resultcode !== '00') {
            return NextResponse.redirect(`${origin}/login?error=naver_profile_failed`);
        }

        const naverUser = profileData.response; // { id, name, email, mobile, profile_image }

        if (!naverUser.email) {
            return NextResponse.redirect(`${origin}/login?error=naver_email_required`);
        }

        // 3. Create or Update Supabase User
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        let supabaseUser = usersData?.users.find(u => u.email === naverUser.email);
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();

        if (!supabaseUser) {
            // Create new user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: naverUser.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: naverUser.name || '네이버유저',
                    phone_number: naverUser.mobile || null,
                    avatar_url: naverUser.profile_image || null,
                    provider: 'naver'
                }
            });

            if (createError || !newUser?.user) {
                console.error('Naver Signup Error:', createError);
                return NextResponse.redirect(`${origin}/login?error=naver_signup_failed`);
            }
            supabaseUser = newUser.user;
        } else {
            // Update password to login
            await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
                password: tempPassword
            });
        }

        // 4. Create Session using Client with updated password
        const supabaseClient = await createSupabaseServerClient();
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: naverUser.email,
            password: tempPassword
        });

        if (authError || !authData.session) {
            console.error('Naver Session Error:', authError);
            return NextResponse.redirect(`${origin}/login?error=naver_session_failed`);
        }

        // 5. Check if profile setup is finished
        const { data: profile } = await supabaseAdmin
             .from('profiles')
             .select('is_setup_finished')
             .eq('id', supabaseUser.id)
             .single();
             
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        const redirectBase = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

        if (profile && !profile.is_setup_finished) {
             return NextResponse.redirect(`${redirectBase}/profile/setup`);
        }

        return NextResponse.redirect(`${redirectBase}/`);
        
    } catch (e) {
        console.error('Naver OAuth Error:', e);
        return NextResponse.redirect(`${origin}/login?error=naver_internal_error`);
    }
}
