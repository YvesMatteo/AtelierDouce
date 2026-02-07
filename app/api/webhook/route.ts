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
        const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
        console.log(`🔑 Secret: ${secret.substring(0, 10)}... (Length: ${secret.length})`);
        console.log(`📨 Signature: ${signature}`);
        console.log(`📦 Body Length: ${body.length}`);

        if (!body || body.length === 0) {
            console.error('❌ Body is empty!');
            return NextResponse.json({ error: 'Empty Body' }, { status: 400 });
        }

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            secret.trim() // Ensure no whitespace
        );
    } catch (err: any) {
        console.error(`❌ Verification Failed: ${err.message}`);
        console.error(`   - Secret Used: ${process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 5)}...`);
        console.error(`   - Signature Header: ${signature}`);
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

            // Prepare items for email
            const emailItems: any[] = [];
            const orderItemsToInsert: any[] = [];

            // Parse cart items from metadata (needed for options mapping)
            let cartItems: any[] = [];
            try {
                cartItems = JSON.parse(session.metadata?.cart_items || '[]');
            } catch (e) {
                console.warn('Could not parse cart_items metadata');
            }

            // 1. Gather all Stripe Product IDs to fetch from DB in one go
            const stripeProductIds: string[] = [];
            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;
                if (product.metadata?.is_gift !== 'true') {
                    stripeProductIds.push(product.id);
                }
            }

            // 2. Fetch all products from our DB in one query
            let dbProducts: any[] = [];
            if (stripeProductIds.length > 0) {
                const { data, error } = await supabaseAdmin
                    .from('products')
                    .select('id, cj_product_id, variants, supplier, stripe_product_id')
                    .in('stripe_product_id', stripeProductIds);

                if (!error && data) {
                    dbProducts = data;
                } else {
                    console.error('Error fetching products batch:', error);
                }
            }


            // 3. Process Line Items (populate email items and prepare DB inserts)
            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;
                let selectedOptions: Record<string, any> = {};

                // Try to parse options from product metadata (New Way)
                try {
                    if (product.metadata?.selected_options) {
                        selectedOptions = JSON.parse(product.metadata.selected_options);
                    }
                } catch (e) {
                    console.warn('Failed to parse selected_options from metadata', product.id);
                }

                // Fallback to cartItems parsing (Old Way - kept for safety or older checkouts)
                if (Object.keys(selectedOptions).length === 0 && cartItems.length > 0) {
                    // Try to find by CJ ID or product ID
                    const cjId = product.metadata?.cj_product_id;
                    const match = cartItems.find((ci: any) => ci.cj_product_id === cjId);
                    if (match) selectedOptions = match.selected_options || {};
                }


                // Handle free gift items
                if (product.metadata?.is_gift === 'true') {
                    // Gift options should be in metadata now, but maintain fallback just in case
                    if (Object.keys(selectedOptions).length === 0) {
                        const giftCartItem = cartItems.find((ci: any) => ci.is_gift === true);
                        const selectedColor = giftCartItem?.selected_options?.Color || 'Gold';
                        selectedOptions = { Color: selectedColor };
                    }

                    const selectedColor = selectedOptions.Color || 'Gold';

                    // Map Color to CJ Variant ID
                    // Gold: 1381486070289534976
                    // Silver: 1381486070348255232
                    const giftCjVariantId = selectedColor === 'Silver'
                        ? '1381486070348255232'
                        : '1381486070289534976';

                    if (isNewOrder) {
                        console.log(`🎁 Processing Gift: ${selectedColor} (CJ ID: ${giftCjVariantId})`);
                        orderItemsToInsert.push({
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
                    }

                    // Add to email items
                    emailItems.push({
                        name: product.name,
                        quantity: 1,
                        options: { Color: selectedColor },
                        cj_product_id: product.metadata?.cj_product_id,
                        supplier: 'CJ'
                    });

                    continue;
                }

                // Standard Products
                // Find product in our fetched list
                const dbProduct = dbProducts.find(p => p.stripe_product_id === product.id);

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
                        if (isNewOrder) console.log(`   🎯 Matched variant: ${cjVariantId} for options:`, selectedOptions);
                    }
                }

                if (isNewOrder) {
                    orderItemsToInsert.push({
                        order_id: order.id,
                        product_id: dbProduct?.id,
                        quantity: item.quantity || 1,
                        price: (item.amount_total || 0) / 100,
                        options: selectedOptions,
                        cj_variant_id: cjVariantId,
                        supplier: dbProduct?.supplier || 'CJ',
                    });
                }

                // Add to email items
                emailItems.push({
                    name: product.name, // Use name from Stripe product
                    quantity: item.quantity || 1,
                    options: selectedOptions,
                    cj_product_id: dbProduct?.cj_product_id,
                    supplier: dbProduct?.supplier || 'CJ'
                });
            }

            // 4. Batch Insert Order Items
            if (isNewOrder && orderItemsToInsert.length > 0) {
                const { error: itemsError } = await supabaseAdmin
                    .from('order_items')
                    .insert(orderItemsToInsert);

                if (itemsError) {
                    console.error('Error inserting order items:', itemsError);
                    // Note: We don't throw here to ensure email logic still attempts to run? 
                    // Or should we strict fail? The order exists, but items failed. 
                    // For now, log it. The email loop relies on 'emailItems' array which is built from Stripe data, so email can still go out.
                } else {
                    console.log(`📝 ${orderItemsToInsert.length} Order items saved locally.`);
                }
            } else if (!isNewOrder) {
                console.log('📝 Order already exists, items not duplicated in DB but populated for email.');
            }

            // Trigger order automation (CJ, Qksource, etc.)
            // await processOrderAutomation(order.id);
            console.log('       🛑 Automation disabled (Manual Fulfillment Mode)');

            // Validate Address
            const shippingAddress = (session as any).shipping_details?.address || session.customer_details?.address;
            if (!shippingAddress) {
                console.warn('⚠️ No address found in session:', session.id);
            } else {
                console.log('📍 Shipping Address found:', shippingAddress);
            }

            // Update order with best available address if needed (redundant usually if insert worked, but good for debug)
            if (shippingAddress) {
                await supabaseAdmin.from('orders').update({
                    shipping_address: shippingAddress
                }).eq('id', order.id);
                // Update local order object for email
                order.shipping_address = shippingAddress;
            }

            // Send Email Notification - Isolated in try/catch to optimize response time/reliability
            try {
                await sendOrderEmail(order, emailItems);
            } catch (emailErr) {
                console.error('Failed to send order email, but order was recorded:', emailErr);
            }

            // Mark abandoned checkout as recovered
            if (session.customer_details?.email) {
                // Fire and forget or simple await
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
