import { createClient } from '@supabase/supabase-js';

if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    try {
        const dns = require('node:dns');
        if (dns && dns.setDefaultResultOrder) {
            dns.setDefaultResultOrder('ipv4first');
        }
    } catch (e) { }
}

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const maxRetries = 3;
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetch(url, { ...options, cache: 'no-store' });
        } catch (err: any) {
            lastError = err;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
    }
    throw lastError;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
// Admin Client (Service Role) - DANGEROUS: Bypass RLS
// Use only in secure server-side contexts (API Routes, Server Actions)

// Build time fallback to prevent crash if env var is missing
// Note: Functionality requiring admin privileges will fail at runtime if key is missing/invalid
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key-for-build';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        fetch: customFetch
    }
});
