import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items } = body; // Array of { id, selectedColor, selectedSize, quantity }

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
        }

        const results = [];

        // Ideally use a single query with IN clause, then map in memory.
        const ids = [...new Set(items.map((i: any) => i.id))];

        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, colors, sizes')
            .in('id', ids);

        if (error) {
            console.error('Stock Check Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
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

            // If neither selected? (Simple product). Assume quantity field on product? 
            // Previous analysis said options are required. 
            // If stock field exists on product? product.quantity?
            // Schema didn't show it.
            // Assume 0 if no options selected but options exist.

            if (stock < item.quantity) {
                results.push({ ...item, valid: false, currentStock: stock, message: `재고 부족 (남은수량: ${stock})` });
            } else {
                results.push({ ...item, valid: true });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
