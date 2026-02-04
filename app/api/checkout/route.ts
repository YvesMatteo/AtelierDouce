
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getCurrencyForCountry, calculatePrice, BASE_PRICE_USD } from '@/lib/currency';
import { calculateDiscount } from '@/lib/discount';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, email } = body; // Expecting { items: [{ productId, quantity, selectedOptions }], email?: string }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        // Detect country and currency
        // We prioritize the server-detected country for security/consistency
        // Detect country and currency
        // We prioritize the server-detected country for security/consistency
        const country = request.headers.get('x-vercel-ip-country') || 'US';
        const { code: currencyCode, rate } = getCurrencyForCountry(country);
        const origin = request.headers.get('origin') || 'https://atelierdouce.shop';

        const lineItems = [];
        const metadataItems: any[] = [];

        // Save Abandoned Checkout if email is provided
        if (email) {
            try {
                // Construct cart items for storage (simplified version of what logic below does, but we need it now)
                // We'll trust the client passed items for the "cart_items" field in DB, 
                // or easier: just allow the client to pass the raw items structure to be saved.
                // However, detailed info is better. 
                // Let's just use the incoming `items` array for now, as it contains productId, quantity, options.
                // We'll rely on the existing items structure.

                await supabase
                    .from('abandoned_checkouts')
                    .upsert({
                        email,
                        cart_items: items, // Save the raw items from request
                        status: 'abandoned',
                        email_sent: false,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'email'
                    });
            } catch (err) {
                console.error('Error saving abandoned checkout:', err);
                // Don't block checkout if this fails
            }
        }

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
                                cj_product_id: '1381486068892831744',
                                selected_options: selectedOptions ? JSON.stringify(selectedOptions) : '{}'
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
                        images: (product.images || []).map((img: string) =>
                            img.startsWith('http') ? img : `${origin}${img}`
                        ),
                        metadata: {
                            product_id: product.id,
                            cj_product_id: product.cj_product_id,
                            selected_options: selectedOptions ? JSON.stringify(selectedOptions) : '{}'
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

        // --- Calculate Shipping ---
        // $7.00 for the first product, $5.00 for each additional product
        let totalShippingItems = 0;
        for (const item of lineItems) {
            // Exclude free gifts (unit_amount === 0) from shipping count
            if (item.price_data.unit_amount > 0) {
                totalShippingItems += item.quantity;
            }
        }

        let shippingCostUSD = 0;
        if (totalShippingItems > 0) {
            // Cap the billable additional items so that shipping stops increasing after 3 products
            // 1 item: $7
            // 2 items: $12
            // 3+ items: $17
            const cappedItems = Math.min(totalShippingItems, 3);
            shippingCostUSD = 7 + (cappedItems - 1) * 5;
        }

        const shippingCostTargetCurrency = calculatePrice(shippingCostUSD, rate);
        const isZeroDecimal = currencyCode === 'JPY';
        const shippingAmount = isZeroDecimal ? shippingCostTargetCurrency : Math.round(shippingCostTargetCurrency * 100);

        const session = await stripe.checkout.sessions.create({
            customer_email: email, // Pre-fill email if provided
            payment_method_types: ['card'],
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic',
                },
            },
            line_items: lineItems,
            mode: 'payment',
            discounts: coupons,
            success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/`,
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true,
            },
            shipping_address_collection: {
                allowed_countries: [
                    'US', 'CA', 'GB', 'AU', 'JP',
                    'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT', // Eurozone main
                    'GR', 'LU', 'CY', 'EE', 'LV', 'LT', 'MT', 'SK', 'SI', 'HR', // Eurozone others
                    'CH', 'SE', 'NO', 'DK', 'PL', 'LI' // Non-Euro Europe
                ],
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: shippingAmount,
                            currency: currencyCode.toLowerCase(),
                        },
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 5,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 12, // Adjusted to be more realistic for dropshipping
                            },
                        },
                    },
                },
            ],
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
