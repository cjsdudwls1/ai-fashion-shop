import { createAdminClient } from './supabase/admin';

// Admin Client (Service Role) - RLS 우회
// 서버 사이드 전용 (API Routes, Server Actions)에서만 사용할 것.
export const supabaseAdmin = createAdminClient();
