import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getCurrencyForCountry, calculatePrice, BASE_PRICE_USD } from '@/lib/currency';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items } = body; // Expecting { items: [{ productId, quantity, selectedOptions }] }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        // Detect country and currency
        // We prioritize the server-detected country for security/consistency
        const country = request.headers.get('x-vercel-ip-country') || 'US';
        const { code: currencyCode, rate } = getCurrencyForCountry(country);

        const lineItems = [];
        const metadataItems: any[] = [];

        for (const item of items) {
            const { productId, quantity = 1, selectedOptions } = item;

            // Get product from Supabase to verify existence and get details
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (productError || !product) {
                console.error(`Product not found: ${productId}`);
                continue;
            }

            // Calculate price based on the fixed base price and current rate
            // This ensures we always charge the equivalent of BASE_PRICE_USD ($49)
            // rounded up to the nearest integer in the local currency.
            const calculatedPrice = calculatePrice(BASE_PRICE_USD, rate);

            // Stripe expects amounts in smallest currency unit (e.g., cents)
            // JPY is zero-decimal. Others in our list are 2-decimal.
            const isZeroDecimal = currencyCode === 'JPY';
            const unitAmount = isZeroDecimal ? calculatedPrice : calculatedPrice * 100;

            lineItems.push({
                price_data: {
                    currency: currencyCode.toLowerCase(),
                    product_data: {
                        name: product.name,
                        description: selectedOptions
                            ? Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')
                            : undefined,
                        images: product.images || [],
                        metadata: {
                            product_id: product.id,
                            cj_product_id: product.cj_product_id,
                        },
                    },
                    unit_amount: unitAmount,
                },
                quantity,
            });

            metadataItems.push({
                product_id: product.id,
                cj_product_id: product.cj_product_id,
                quantity: quantity,
                selected_options: selectedOptions,
                charged_currency: currencyCode,
                charged_amount: calculatedPrice,
            });
        }

        if (lineItems.length === 0) {
            return NextResponse.json({ error: 'No valid items to checkout' }, { status: 400 });
        }

        // Calculate discounts
        const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        const coupons = [];

        if (totalQuantity >= 4) {
            // "Buy 4 Get 1 Free" equivalent (25% off logic deals better with mixed price carts)
            const coupon = await stripe.coupons.create({
                percent_off: 25,
                duration: 'once',
                name: 'Buy 4 Get 1 Free (25% Off)',
            });
            coupons.push({ coupon: coupon.id });
        } else if (totalQuantity >= 2) {
            // Buy 2 Get 20% Off
            const coupon = await stripe.coupons.create({
                percent_off: 20,
                duration: 'once',
                name: 'Buy 2 Get 20% Off',
            });
            coupons.push({ coupon: coupon.id });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            discounts: coupons,
            success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'BE'],
            },
            metadata: {
                cart_items: JSON.stringify(metadataItems).substring(0, 500),
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
