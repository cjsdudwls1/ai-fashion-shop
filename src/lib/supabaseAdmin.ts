import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Admin Client (Service Role) - DANGEROUS: Bypass RLS
// Use only in secure server-side contexts (API Routes, Server Actions)

// Build time fallback to prevent crash if env var is missing
// Note: Functionality requiring admin privileges will fail at runtime if key is missing/invalid
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key-for-build';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
