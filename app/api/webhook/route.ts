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
            // Parse cart items from metadata to get selected options per product
            let cartItems: any[] = [];
            try {
                cartItems = JSON.parse(session.metadata?.cart_items || '[]');
            } catch (e) {
                console.warn('Could not parse cart_items metadata');
            }

            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;

                // Handle free gift items
                if (product.metadata?.is_gift === 'true') {
                    // Gift item - use hardcoded CJ ID for the gift product
                    await supabase.from('order_items').insert({
                        order_id: order.id,
                        product_id: null, // Gift might not be in our DB
                        quantity: 1,
                        price: 0,
                        options: { is_gift: true },
                        cj_variant_id: '2402050548251627600', // Cloud bag CJ variant ID
                    });
                    continue;
                }

                // Find product in our database by Stripe product ID
                const { data: dbProduct } = await supabase
                    .from('products')
                    .select('id, cj_product_id, variants')
                    .eq('stripe_product_id', product.id)
                    .single();

                // Find the matching cart item to get selected options
                const cartItem = cartItems.find((ci: any) => ci.cj_product_id === dbProduct?.cj_product_id);
                const selectedOptions = cartItem?.selected_options || {};

                // Look up the correct variant ID from the variants array
                let cjVariantId = dbProduct?.cj_product_id; // Fallback to product ID
                if (dbProduct?.variants && Array.isArray(dbProduct.variants)) {
                    const matchingVariant = dbProduct.variants.find((v: any) => {
                        if (!v.options || Object.keys(selectedOptions).length === 0) return false;
                        // Check if all selected options match
                        return Object.entries(selectedOptions).every(
                            ([key, value]) => v.options[key] === value
                        );
                    });
                    if (matchingVariant) {
                        cjVariantId = matchingVariant.id;
                        console.log(`   🎯 Matched variant: ${cjVariantId} for options:`, selectedOptions);
                    }
                }

                await supabase.from('order_items').insert({
                    order_id: order.id,
                    product_id: dbProduct?.id,
                    quantity: item.quantity || 1,
                    price: (item.amount_total || 0) / 100,
                    options: selectedOptions,
                    cj_variant_id: cjVariantId,
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
