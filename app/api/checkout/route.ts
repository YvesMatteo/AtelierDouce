
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
            // Handle Free Gift
            if (productId === 'GIFT-EARRINGS') {
                lineItems.push({
                    price_data: {
                        currency: currencyCode.toLowerCase(),
                        product_data: {
                            name: 'Free Gift: Elegant Collection Piece (Earrings)',
                            images: [selectedOptions?.Color === 'Silver'
                                ? 'https://cf.cjdropshipping.com/1618206790585.jpg' // Silver
                                : 'https://cf.cjdropshipping.com/1618206790596.jpg' // Gold
                            ],
                            metadata: {
                                is_gift: 'true',
                                cj_product_id: '1381486068892831744'
                            },
                        },
                        unit_amount: 0,
                    },
                    quantity: 1, // Force quantity 1 for gift
                });

                metadataItems.push({
                    product_id: 'GIFT-EARRINGS',
                    cj_product_id: '1381486068892831744',
                    quantity: 1,
                    selected_options: selectedOptions, // Pass Gold/Silver choice
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

            // Calculate price based on the product price from DB
            const basePrice = product.price || BASE_PRICE_USD;
            const calculatedPrice = calculatePrice(basePrice, rate);

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

            // Store for discount calculation
            // We use a temporary array or push to a collection here would be better,
            // but since we are iterating, we can reconstruct or modify the logic.
            // Let's modify the loop to map items to a new structure that includes price, then proceed.
            // However, to minimize refactoring risk, let's just push to a local array.

        }

        if (lineItems.length === 0) {
            return NextResponse.json({ error: 'No valid items to checkout' }, { status: 400 });
        }

        // --- Calculate Discounts (Using Shared Logic) ---
        // --- Calculate Discounts (Using Shared Logic) ---
        // Reuse lineItems which have the correct, DB-verified prices in cents/smallest unit
        const calcItems = lineItems
            .filter(li => li.price_data.unit_amount > 0) // Exclude gifts
            .map(li => ({
                price: li.price_data.unit_amount,
                quantity: li.quantity
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
                allowed_countries: [
                    'US', 'CA', 'GB', 'AU', 'JP',
                    'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT', // Eurozone main
                    'GR', 'LU', 'CY', 'EE', 'LV', 'LT', 'MT', 'SK', 'SI', 'HR', // Eurozone others
                    'CH', 'SE', 'NO', 'DK', 'PL', 'LI' // Non-Euro Europe
                ],
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
