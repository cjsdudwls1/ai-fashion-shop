import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SupabaseClient } from '@supabase/supabase-js';
import { StockCheckItem, StockCheckResult, DeductStockItem } from '@/types/product';

export const stockService = {
    async validateStock(items: StockCheckItem[], client: SupabaseClient): Promise<StockCheckResult[]> {
        const results: StockCheckResult[] = [];
        
        const ids = [...new Set(items.map(i => i.id))];

        const { data: products, error } = await client
            .from('products')
            .select('id, name, colors, sizes')
            .in('id', ids);

        if (error) {
            console.error('Stock Check Error:', error);
            throw new Error('Database error');
        }

        const productMap = new Map(products?.map(p => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.id);
            if (!product) {
                results.push({ ...item, valid: false, message: 'Product not found' });
                continue;
            }

            const colors = product.colors || [];
            const sizes = product.sizes || [];

            let stock = 0;

            // Check Color Stock
            if (item.selectedColor) {
                const c = colors.find((c: any) => c.color === item.selectedColor);
                if (c) {
                    stock = typeof c.quantity === 'string' ? parseInt(c.quantity, 10) : c.quantity;
                } else {
                    results.push({ ...item, valid: false, message: `Color ${item.selectedColor} invalid` });
                    continue;
                }
            }

            // Check Size Stock
            if (item.selectedSize) {
                const s = sizes.find((s: any) => s.size === item.selectedSize);
                if (s) {
                    const sQty = typeof s.quantity === 'string' ? parseInt(s.quantity, 10) : s.quantity;
                    if (item.selectedColor) {
                        stock = Math.min(stock, sQty);
                    } else {
                        stock = sQty;
                    }
                } else {
                    results.push({ ...item, valid: false, message: `Size ${item.selectedSize} invalid` });
                    continue;
                }
            }

            if (stock < item.quantity) {
                results.push({ ...item, valid: false, currentStock: stock, message: `재고 부족 (남은수량: ${stock})` });
            } else {
                results.push({ ...item, valid: true });
            }
        }

        return results;
    },

    async deductStock(items: DeductStockItem[]): Promise<{ success: boolean; error?: string }> {
        const { data, error } = await supabaseAdmin.rpc('deduct_stock', {
            p_items: items
        });
        
        if (error) {
            console.error('deduct_stock rpc error:', error);
            return { success: false, error: error.message };
        }
        
        if (data && typeof data === 'object' && !Array.isArray(data) && data.success === false) {
           return { success: false, error: data.error };
        }
        
        return { success: true };
    }
};
