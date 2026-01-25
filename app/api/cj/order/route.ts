import { NextResponse } from 'next/server';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';
import { processOrderToCJ } from '@/lib/automation';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await processOrderToCJ(orderId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            cjOrderId: result.cjOrderId,
        });

    } catch (error: any) {
        console.error('CJ Order API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
