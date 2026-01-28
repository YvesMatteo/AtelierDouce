import { NextResponse } from 'next/server';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';
import { processOrderAutomation } from '@/lib/automation';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        const result = await processOrderAutomation(orderId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            results: result.results
        });

    } catch (error: any) {
        console.error('CJ Order API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
