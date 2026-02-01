import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, cartItems } = body;

        if (!email || !cartItems) {
            return NextResponse.json({ error: 'Missing email or cart items' }, { status: 400 });
        }

        // Upsert abandoned checkout record
        // This will create a new one or update an existing one for the same email
        // We use email as the conflict key for now to avoid multiple records for the same user
        const { data, error } = await supabase
            .from('abandoned_checkouts')
            .upsert({
                email,
                cart_items: cartItems,
                status: 'abandoned',
                email_sent: false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email'
            })
            .select();

        if (error) {
            console.error('Error saving abandoned checkout:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Abandonment API error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('abandoned_checkouts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, cartItems: data.cart_items });
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
