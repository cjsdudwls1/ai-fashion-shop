import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export interface DefaultShipping {
    name: string;
    phone: string;
    zonecode: string;
    roadAddress: string;
    detailAddress: string;
}

export function useCheckoutAuth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [defaultShipping, setDefaultShipping] = useState<DefaultShipping | null>(null);

    useEffect(() => {
        let ignore = false;

        const checkAuthAndLoadData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (ignore) return;

                if (user) {
                    setUser(user);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, phone_number')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (ignore) return;

                    const { data: address } = await supabase
                        .from('addresses')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('is_default', true)
                        .maybeSingle();

                    if (ignore) return;

                    const fallbackName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
                    const fallbackPhone = profile?.phone_number || user?.phone || user?.user_metadata?.phone_number || '';

                    setDefaultShipping({
                        name: fallbackName,
                        phone: fallbackPhone,
                        zonecode: address?.zonecode || '',
                        roadAddress: address?.road_address || '',
                        detailAddress: address?.detail_address || '',
                    });
                }
            } catch (error) {
                if (!ignore) {
                    console.error('Auth check error:', error);
                }
            } finally {
                if (!ignore) {
                    setAuthLoading(false);
                }
            }
        };

        checkAuthAndLoadData();

        return () => { ignore = true; };
    }, [router]);

    return { user, authLoading, defaultShipping };
}
