import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
            const nameToEmail = (inputName: string): string => {
                const n = inputName.trim();
                if (n.includes('@')) return n;
                const encoder = new TextEncoder();
                const bytes = encoder.encode(n);
                let hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                if (hex.length > 50) {
                    let h1 = 0x811c9dc5; let h2 = 0;
                    for (let i = 0; i < n.length; i++) {
                        const c = n.charCodeAt(i);
                        h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
                        h2 = (h2 * 31 + c) >>> 0;
                    }
                    hex = `${h1.toString(36)}${h2.toString(36)}${n.length.toString(36)}`;
                }
                return `u_${hex}@aifashion-store.com`;
            };
            const generatedEmail = nameToEmail(name);

            // 해당 이메일을 가진 사용자를 찾아서 비밀번호 변경
            let page = 1;
            let targetUser = null;
            while (true) {
                const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
                if (!data || !data.users || data.users.length === 0) break;

                const found = data.users.find((u: any) => u.email === generatedEmail);
                if (found) {
                    targetUser = found;
                    break;
                }
                if (data.users.length < 100) break;
                page++;
            }

            if (targetUser && targetUser.id !== userId) {
                const res2 = await supabaseAdmin.auth.admin.updateUserById(
                    targetUser.id,
                    { password: newPassword }
                );
                if (res2.error) lastUpdateError = res2.error;
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
