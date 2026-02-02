import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderEmail } from '@/lib/email';
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

            // Save order to Supabase using Admin client to bypass RLS
            let order;
            let isNewOrder = true;

            const { data: newOrder, error: orderError } = await supabaseAdmin
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
                if (orderError.code === '23505') { // Unique violation
                    console.log('⚠️ Order already exists. Handling idempotently.');
                    const { data: existingOrder } = await supabaseAdmin
                        .from('orders')
                        .select()
                        .eq('stripe_session_id', session.id)
                        .single();
                    order = existingOrder;
                    isNewOrder = false;
                } else {
                    console.error('Error saving order:', orderError);
                    throw orderError;
                }
            } else {
                order = newOrder;
                console.log('📦 Order saved:', order.id);
            }

            // Save order items (only if new order)
            // Parse cart items from metadata to get selected options per product
            let cartItems: any[] = [];
            try {
                cartItems = JSON.parse(session.metadata?.cart_items || '[]');
            } catch (e) {
                console.warn('Could not parse cart_items metadata');
            }

            if (isNewOrder) {
                for (const item of lineItems.data) {
                    const product = item.price?.product as Stripe.Product;

                    // Handle free gift items
                    if (product.metadata?.is_gift === 'true') {
                        // Find the gift item in cart_items metadata to get the selected color
                        const giftCartItem = cartItems.find((ci: any) => ci.is_gift === true);
                        const selectedColor = giftCartItem?.selected_options?.Color || 'Gold'; // Default to Gold

                        // Map Color to CJ Variant ID
                        // Gold: 1381486070289534976
                        // Silver: 1381486070348255232
                        const giftCjVariantId = selectedColor === 'Silver'
                            ? '1381486070348255232'
                            : '1381486070289534976';

                        console.log(`🎁 Processing Gift: ${selectedColor} (CJ ID: ${giftCjVariantId})`);

                        await supabaseAdmin.from('order_items').insert({
                            order_id: order.id,
                            product_id: null, // Gift might not be in our DB
                            quantity: 1,
                            price: 0,
                            options: {
                                is_gift: true,
                                Color: selectedColor
                            },
                            cj_variant_id: giftCjVariantId,
                            supplier: 'CJ', // Default gifts to CJ for now
                        });
                        continue;
                    }

                    // Find product in our database by Stripe product ID
                    // Use Admin client to ensure we can read products if any policies are restrictive (though normally products are public)
                    const { data: dbProduct } = await supabaseAdmin
                        .from('products')
                        .select('id, cj_product_id, variants, supplier')
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

                    await supabaseAdmin.from('order_items').insert({
                        order_id: order.id,
                        product_id: dbProduct?.id,
                        quantity: item.quantity || 1,
                        price: (item.amount_total || 0) / 100,
                        options: selectedOptions,
                        cj_variant_id: cjVariantId,
                        supplier: dbProduct?.supplier || 'CJ',
                    });
                }
                console.log('📝 Order items saved');
            } else {
                console.log('📝 Skipping duplicate order items');
            }

            // Trigger order automation (CJ, Qksource, etc.)
            // await processOrderAutomation(order.id);
            console.log('       🛑 Automation disabled (Manual Fulfillment Mode)');

            // Send Email Notification
            await sendOrderEmail(order, cartItems.map((ci: any) => ({
                name: ci.name || 'Unknown Product',
                quantity: ci.quantity || 1,
                options: ci.selected_options,
                cj_product_id: ci.cj_product_id,
                supplier: ci.supplier
            })));

            // Mark abandoned checkout as recovered
            if (session.customer_details?.email) {
                await supabaseAdmin
                    .from('abandoned_checkouts')
                    .update({ status: 'recovered', updated_at: new Date().toISOString() })
                    .eq('email', session.customer_details.email);
            }

        } catch (error: any) {
            console.error('Error processing order:', error);
            return NextResponse.json(
                { error: `Order Processing Failed: ${error.message}` },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
