
import dotenv from 'dotenv';
import path from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Use latest or matching version
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Map of product IDs for email links (copying basic logic from email.ts/product-url-map)
// Simplification: We will just fetch details dynamically or use placeholders if map is missing
// For this script, we'll try to replicate the email logic inline to avoid complex imports

async function sendOrderEmail(order: any, items: any[]) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️ Gmail credentials not found. Skipping email notification.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const itemsHtml = items.map(item => {
        return `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.name}</strong> (Qty: ${item.quantity})</p>
                <p style="color: #666; font-size: 14px;">Options: ${JSON.stringify(item.options)}</p>
                <p style="font-size: 12px; color: #999;">Supplier ID: ${item.cj_product_id || 'N/A'}</p>
            </div>
        `;
    }).join('');

    const addr = order.shipping_address || {};
    const addressHtml = `
        <p>
            ${order.customer_name || 'Customer'}<br>
            ${addr.line1 || ''}<br>
            ${addr.line2 ? addr.line2 + '<br>' : ''}
            ${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}<br>
            ${addr.country || ''}
        </p>
    `;

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: `🔔 [MANUAL RECOVERY] New Order to Fulfill: ${order.id}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>New Order Received (Manually Recovered)</h1>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
                <hr>
                <h2>📦 Items to Order</h2>
                ${itemsHtml}
                <hr>
                <h2>🚚 Shipping Address</h2>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                    ${addressHtml}
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Order notification sent:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

async function processEvent(eventId: string) {
    console.log(`Processing event: ${eventId}`);

    // 1. Fetch Event
    const event = await stripe.events.retrieve(eventId);
    if (event.type !== 'checkout.session.completed') {
        throw new Error(`Event type is ${event.type}, expected checkout.session.completed`);
    }

    const session = event.data.object as Stripe.Checkout.Session;
    console.log('✅ Found session:', session.id);

    // 2. Get Line Items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
    });

    // 3. Save Order
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

    let order;

    if (orderError) {
        if (orderError.code === '23505') {
            console.log('⚠️ Order already exists in database. Fetching existing order...');
            const { data: existingOrder } = await supabaseAdmin
                .from('orders')
                .select()
                .eq('stripe_session_id', session.id)
                .single();
            console.log('📦 Existing Order ID:', existingOrder?.id);
            order = existingOrder;
            // Don't return, continue to email
        } else {
            console.error('Error saving order:', orderError);
            throw orderError;
        }
    } else {
        order = newOrder;
        console.log('📦 Order saved:', order.id);
    }

    // 4. Order Items
    let cartItems: any[] = [];
    try {
        cartItems = JSON.parse(session.metadata?.cart_items || '[]');
    } catch (e) {
        console.warn('Could not parse cart_items metadata');
    }

    for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;

        // Handle free gift items (Simulated logic from webhook)
        if (product.metadata?.is_gift === 'true') {
            const giftCartItem = cartItems.find((ci: any) => ci.is_gift === true);
            const selectedColor = giftCartItem?.selected_options?.Color || 'Gold';
            const giftCjVariantId = selectedColor === 'Silver' ? '1381486070348255232' : '1381486070289534976';

            await supabaseAdmin.from('order_items').insert({
                order_id: order.id,
                product_id: null,
                quantity: 1,
                price: 0,
                options: { is_gift: true, Color: selectedColor },
                cj_variant_id: giftCjVariantId,
                supplier: 'CJ',
            });
            console.log('🎁 Processed Gift');
            continue;
        }

        // Find product in DB
        const { data: dbProduct } = await supabaseAdmin
            .from('products')
            .select('id, cj_product_id, variants, supplier')
            .eq('stripe_product_id', product.id)
            .single();

        const cartItem = cartItems.find((ci: any) => ci.cj_product_id === dbProduct?.cj_product_id);
        const selectedOptions = cartItem?.selected_options || {};

        // Variant matching
        let cjVariantId = dbProduct?.cj_product_id;
        if (dbProduct?.variants && Array.isArray(dbProduct.variants)) {
            const matchingVariant = dbProduct.variants.find((v: any) => {
                if (!v.options || Object.keys(selectedOptions).length === 0) return false;
                return Object.entries(selectedOptions).every(
                    ([key, value]) => v.options[key] === value
                );
            });
            if (matchingVariant) cjVariantId = matchingVariant.id;
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

    // 5. Send Email
    await sendOrderEmail(order, cartItems.map((ci: any) => ({
        name: ci.name || 'Unknown Product',
        quantity: ci.quantity || 1,
        options: ci.selected_options,
        cj_product_id: ci.cj_product_id,
        supplier: ci.supplier
    })));

    // 6. Recover Abandoned
    if (session.customer_details?.email) {
        await supabaseAdmin
            .from('abandoned_checkouts')
            .update({ status: 'recovered', updated_at: new Date().toISOString() })
            .eq('email', session.customer_details.email);
        console.log('✅ Abandoned checkout recovered');
    }
}

// Run (Event ID from user chat)
processEvent('evt_1Sw9tKDcMkrXy2wDPfGdpXL7').catch(console.error);
