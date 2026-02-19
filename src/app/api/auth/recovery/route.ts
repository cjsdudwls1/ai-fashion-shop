import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin 클라이언트는 Service Role Key를 사용
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: Request) {
    try {
        const { action, name, phone, username, newPassword } = await request.json();

        // 1. 아이디 찾기 (Find ID)
        if (action === 'find-id') {
            if (!name || !phone) {
                return NextResponse.json({ error: '이름과 전화번호를 입력해주세요.' }, { status: 400 });
            }

            // 프로필 테이블에서 검색
            const { data: profiles, error } = await supabaseAdmin
                .from('profiles')
                .select('username')
                .eq('full_name', name)
                .eq('phone_number', phone);

            if (error) {
                console.error('Profile search error:', error);
                return NextResponse.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
            }

            if (!profiles || profiles.length === 0) {
                return NextResponse.json({ error: '일치하는 사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
            }

            // 첫 번째 매칭되는 유저의 아이디 반환
            const validProfile = profiles.find(p => p.username);
            if (!validProfile) {
                return NextResponse.json({ error: '일치하는 아이디가 없습니다.' }, { status: 404 });
            }


            return NextResponse.json({ username: validProfile.username });
        }

        // 2. 사용자 확인 (Verify User for Password Reset Step 1)
        else if (action === 'verify-user') {
            if (!username || !name || !phone) {
                return NextResponse.json({ error: '아이디, 이름, 전화번호를 모두 입력해주세요.' }, { status: 400 });
            }

            const { data: profile, error } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('username', username)
                .eq('full_name', name)
                .eq('phone_number', phone)
                .single();

            if (error || !profile) {
                return NextResponse.json({ error: '일치하는 계정 정보를 찾을 수 없습니다.' }, { status: 404 });
            }

            return NextResponse.json({ message: '확인되었습니다.' });
        }

        // 2. 비밀번호 재설정 (Reset Password)
        else if (action === 'reset-password') {
            if (!username || !name || !phone || !newPassword) {
                return NextResponse.json({ error: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
            }

            // 정보 확인: username, name, phone이 모두 일치하는지
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('username', username)
                .eq('full_name', name)
                .eq('phone_number', phone)
                .single();

            if (profileError || !profile) {
                return NextResponse.json({ error: '입력하신 정보와 일치하는 계정이 없습니다.' }, { status: 404 });
            }

            const userId = profile.id;

            // 비밀번호 강제 업데이트 (Admin API)
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: newPassword }
            );

            if (updateError) {
                console.error('Password update failure:', updateError);
                return NextResponse.json({ error: '비밀번호 변경 실패: ' + updateError.message }, { status: 500 });
            }

            return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        }

        return NextResponse.json({ error: '올바르지 않은 요청입니다.' }, { status: 400 });

    } catch (error: any) {
        console.error('Account recovery error:', error);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
