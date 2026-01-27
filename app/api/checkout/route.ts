
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getCurrencyForCountry, calculatePrice, BASE_PRICE_USD } from '@/lib/currency';
import { calculateDiscount } from '@/lib/discount';

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

            // Handle Free Gift
            if (productId === 'GIFT-CLOUD-BAG') {
                lineItems.push({
                    price_data: {
                        currency: currencyCode.toLowerCase(),
                        product_data: {
                            name: 'Free Gift: Niche Plaid Cloud Bag',
                            images: ['https://cf.cjdropshipping.com/quick/product/d4273748-7689-4640-ad06-9119fef2c10a.jpg'],
                            metadata: { is_gift: 'true' },
                        },
                        unit_amount: 0,
                    },
                    quantity: 1, // Force quantity 1 for gift
                });

                metadataItems.push({
                    product_id: 'GIFT-CLOUD-BAG',
                    quantity: 1,
                    is_gift: true
                });
                continue;
            }

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

        // --- Calculate Discounts (Using Shared Logic) ---
        const isZeroDecimal = currencyCode === 'JPY';
        const singleItemPrice = calculatePrice(BASE_PRICE_USD, rate);
        const singleItemUnitAmount = isZeroDecimal ? singleItemPrice : singleItemPrice * 100;

        // Prepare items for calculation
        const calcItems = items
            .filter((item: any) => item.productId !== 'GIFT-CLOUD-BAG')
            .map((item: any) => ({
                price: singleItemUnitAmount,
                quantity: item.quantity || 1
            }));

        const discountAmount = calculateDiscount(calcItems);

        const coupons = [];
        if (discountAmount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: discountAmount,
                currency: currencyCode.toLowerCase(),
                duration: 'once',
                name: 'Discount (Applied at Checkout)',
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
    } catch (err: unknown) {
        console.error('Checkout error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
