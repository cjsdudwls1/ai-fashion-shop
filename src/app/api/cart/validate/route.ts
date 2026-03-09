import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { stockService } from '@/services/stockService';

export async function POST(req: NextRequest) {
    const supabase = await createServerClient();
    try {
        const body = await req.json();
        const { items } = body; // Array of { id, selectedColor, selectedSize, quantity }

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
        }

        const results = await stockService.validateStock(items, supabase);

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Cart Validate API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
