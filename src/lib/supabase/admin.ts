import { createClient as createJSClient } from '@supabase/supabase-js';
import { customFetch } from '@/lib/supabaseClient';

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key-for-build';

    return createJSClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                fetch: customFetch
            }
        }
    );
}
