import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, quantity = 1, selectedOptions } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Get product from Supabase
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Use Stripe Price ID if available, otherwise create dynamic price
        let lineItem: any;

        if (product.stripe_price_id) {
            lineItem = {
                price: product.stripe_price_id,
                quantity,
            };
        } else {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: product.images || [],
                        metadata: {
                            product_id: product.id,
                            cj_product_id: product.cj_product_id,
                        },
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity,
            };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/product/${productId}`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'BE'],
            },
            metadata: {
                product_id: product.id,
                cj_product_id: product.cj_product_id,
                selected_options: JSON.stringify(selectedOptions || {}),
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
