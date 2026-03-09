import { supabase } from '@/lib/supabase';

// [2026-03-06] 그룹 F: 프로필 설정 완료 확인 유틸리티
// 사유: auth/callback/page.tsx 등에서 프로필 설정 여부 판단 로직이 인라인으로 존재
// 근거: .docs/refactoring-group-f-shared-utils.md — profileUtils 분리
export async function isProfileSetupDone(userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', userId)
        .single();

    return !!(data?.name && data?.phone);
}
