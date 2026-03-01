import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const ids = url.searchParams.get('ids');

        if (!ids) {
            return NextResponse.json({});
        }

        const productIds = ids.split(',').filter(Boolean);
        if (productIds.length === 0) {
            return NextResponse.json({});
        }

        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('id, image_url')
            .in('id', productIds);

        if (error) {
            console.error('Product images fetch error:', error);
            return NextResponse.json({});
        }

        const imageMap: Record<string, string> = {};
        (products || []).forEach(p => {
            if (p.image_url) imageMap[p.id] = p.image_url;
        });

        return NextResponse.json(imageMap);
    } catch (error) {
        console.error('Product images API error:', error);
        return NextResponse.json({});
    }
}
