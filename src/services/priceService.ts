import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';

export const syncLatestPrices = async (ignore: boolean = false) => {
    const currentItems = useCartStore.getState().items;
    if (currentItems.length === 0) return;

    const ids = [...new Set(currentItems.map(item => item.id))];
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, price')
            .in('id', ids);

        if (!ignore && !error && data) {
            const priceMap: Record<string, number> = {};
            data.forEach(p => { priceMap[p.id] = p.price; });
            useCartStore.getState().updatePrices(priceMap);
        }
    } catch (err) {
        if (!ignore) {
            console.error("Failed to fetch latest prices", err);
        }
    }
};
