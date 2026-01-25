import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { processOrderToCJ } from '@/lib/automation';
import Stripe from 'stripe';

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Payment successful for session:', session.id);

        try {
            // Get line items
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product'],
            });

            // Save order to Supabase
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    stripe_session_id: session.id,
                    stripe_payment_intent: session.payment_intent as string,
                    customer_email: session.customer_details?.email,
                    customer_name: session.customer_details?.name,
                    shipping_address: (session as any).shipping_details?.address,
                    status: 'paid',
                    amount_total: session.amount_total,
                    currency: session.currency,
                })
                .select()
                .single();

            if (orderError) {
                console.error('Error saving order:', orderError);
                throw orderError;
            }

            console.log('📦 Order saved:', order.id);

            // Save order items
            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;

                // Find product in our database by Stripe product ID
                const { data: dbProduct } = await supabase
                    .from('products')
                    .select('id, cj_product_id')
                    .eq('stripe_product_id', product.id)
                    .single();

                await supabase.from('order_items').insert({
                    order_id: order.id,
                    product_id: dbProduct?.id,
                    quantity: item.quantity || 1,
                    price: (item.amount_total || 0) / 100,
                    options: session.metadata,
                    cj_variant_id: dbProduct?.cj_product_id,
                });
            }

            console.log('📝 Order items saved');

            // Trigger CJ order creation
            await processOrderToCJ(order.id);

        } catch (error) {
            console.error('Error processing order:', error);
            // Still return 200 to prevent Stripe retries, but log the error
        }
    }

    return NextResponse.json({ received: true });
}
