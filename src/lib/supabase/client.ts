import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import { customFetch } from '@/lib/supabaseClient';

export function createBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

    return createSSRBrowserClient(
        supabaseUrl,
        supabaseKey,
        {
            global: {
                fetch: customFetch
            }
        }
    );
}
