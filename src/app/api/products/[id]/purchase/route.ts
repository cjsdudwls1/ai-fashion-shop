import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Admin access if needed for update without RLS? Or use anon key with RLS allowing update?)
// Assuming anon key has update permissions or server logic bypasses RLS if using service role key.
// Since we don't have service role key easily available in client-side env vars usually, we might rely on RLS policies allowing authenticated users to update?
// But typically users shouldn't update product stock directly.
// This is a "temporary test" endpoint. 
// I will use process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.
// Note: If RLS prevents update, this will fail. We might need SERVICE_ROLE_KEY for admin tasks.
// But let's try standard client first.

// Use Service Role Key for Admin privileges (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { color, size, quantity } = body;

        if (!id || !color || !size || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch current product data (colors, sizes)
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('colors, sizes, name')
            .eq('id', id)
            .single();

        if (fetchError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Validate Stock
        const colors = product.colors || [];
        const sizes = product.sizes || [];

        const colorIdx = colors.findIndex((c: any) => c.color === color);
        const sizeIdx = sizes.findIndex((s: any) => s.size === size);

        if (colorIdx === -1) return NextResponse.json({ error: `Invalid color: ${color}` }, { status: 400 });
        if (sizeIdx === -1) return NextResponse.json({ error: `Invalid size: ${size}` }, { status: 400 });

        const currentColorStock = colors[colorIdx].quantity;
        const currentSizeStock = sizes[sizeIdx].quantity;

        if (currentColorStock < quantity) {
            return NextResponse.json({ error: `Not enough stock for color ${color} (Left: ${currentColorStock})` }, { status: 400 });
        }
        if (currentSizeStock < quantity) {
            return NextResponse.json({ error: `Not enough stock for size ${size} (Left: ${currentSizeStock})` }, { status: 400 });
        }

        // 3. Deduct Stock
        colors[colorIdx].quantity -= quantity;
        sizes[sizeIdx].quantity -= quantity;

        // 4. Update Database
        const { error: updateError } = await supabase
            .from('products')
            .update({ colors, sizes })
            .eq('id', id);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully purchased ${quantity} item(s). Stock updated.`,
            remainingStock: {
                color: colors[colorIdx].quantity,
                size: sizes[sizeIdx].quantity
            }
        });

    } catch (error) {
        console.error('Purchase API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
