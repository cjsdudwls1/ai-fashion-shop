import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { nameToEmail } from '@/lib/authHelpers';

export async function POST(request: Request) {
    try {
        const { action, name, phone, newPassword } = await request.json();

        // 1. 사용자 확인 (Verify User for Password Reset Step 1)
        if (action === 'verify-user') {
            if (!name || !phone) {
                return NextResponse.json({ error: '이름과 전화번호를 모두 입력해주세요.' }, { status: 400 });
            }

            const { data: profiles, error } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('full_name', name)
                .eq('phone_number', phone)
                .limit(1);

            if (error || !profiles || profiles.length === 0) {
                return NextResponse.json({ error: '일치하는 계정 정보를 찾을 수 없습니다.' }, { status: 404 });
            }

            return NextResponse.json({ message: '확인되었습니다.' });
        }

        // 2. 비밀번호 재설정 (Reset Password)
        else if (action === 'reset-password') {
            if (!name || !phone || !newPassword) {
                return NextResponse.json({ error: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
            }

            const { data: profiles, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('full_name', name)
                .eq('phone_number', phone)
                .limit(1);

            if (profileError || !profiles || profiles.length === 0) {
                return NextResponse.json({ error: '입력하신 정보와 일치하는 계정이 없습니다.' }, { status: 404 });
            }

            const userId = profiles[0].id;

            // 1. 기존 프로필과 연결된 계정의 비밀번호 업데이트
            let lastUpdateError = null;
            const res1 = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: newPassword }
            );
            if (res1.error) lastUpdateError = res1.error;

            // 2. 로그인 시 생성되는 이메일(nameToEmail)과 연결된 계정(고스트 계정)도 동일하게 비밀번호 업데이트 
            //    (이름을 변경한 경우 로그인 시 Ghost 계정으로 시도될 수 있으므로 둘 다 변경)
            
            // O(1) Direct Access Pattern: auth.users 대신 profiles 테이블의 username(또는 full_name)을 통해 고스트 계정 id 직접 조회
            const { data: ghostProfiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('username', name.trim())
                .limit(1);

            if (ghostProfiles && ghostProfiles.length > 0) {
                const targetUserId = ghostProfiles[0].id;
                if (targetUserId !== userId) {
                    const res2 = await supabaseAdmin.auth.admin.updateUserById(
                        targetUserId,
                        { password: newPassword }
                    );
                    if (res2.error) lastUpdateError = res2.error;
                }
            }

            if (lastUpdateError) {
                console.error('Password update failure:', lastUpdateError);
                return NextResponse.json({ error: '비밀번호 변경 실패: ' + lastUpdateError.message }, { status: 500 });
            }

            return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        }

        return NextResponse.json({ error: '올바르지 않은 요청입니다.' }, { status: 400 });

    } catch (error: any) {
        console.error('Account recovery error:', error);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
