import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stockService } from '@/services/stockService';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createAdminClient();
    try {
        const { id } = await params;
        const body = await req.json();
        const { color, size, quantity } = body;

        if (!id || !color || !size || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Validate Stock
        const validateResults = await stockService.validateStock([{
            id,
            selectedColor: color,
            selectedSize: size,
            quantity
        }], supabase);

        const validateResult = validateResults[0];
        if (!validateResult.valid) {
            return NextResponse.json({ error: validateResult.message }, { status: 400 });
        }

        // 2. Deduct Stock
        const deductResult = await stockService.deductStock([{
            product_id: id,
            color,
            size,
            quantity
        }]);

        if (!deductResult.success) {
            return NextResponse.json({ error: deductResult.error || 'Failed to update stock' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully purchased ${quantity} item(s). Stock updated.`,
        });

    } catch (error) {
        console.error('Purchase API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
