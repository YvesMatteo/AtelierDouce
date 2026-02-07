
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRODUCT = {
    id: 'faux-fur-coat-2026', // Unique ID
    name: "Luxurious Faux Fur Coat",
    description: "Elevate your winter wardrobe with this stunning Luxurious Faux Fur Coat. Crafted for elegance and warmth, this coat features a thick, plush design that mimics the softness of real fur while being 100% cruelty-free. Perfect for evening events or chic daily wear.",
    price: 189.00,
    images: [
        "/products/faux-fur-coat-1.jpg",
        "/products/faux-fur-coat-2.png",
        "/products/faux-fur-coat-3.png"
    ],
    category: 'Clothing',
    supplier: 'Qksource',
    gender: 'Woman',
    options: [
        { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] },
        { name: 'Color', values: ['Beige', 'Black', 'Brown'] }
    ]
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log(`Starting adding product: ${PRODUCT.name}`);

    try {
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // 1. Check existing in Supabase
        const { data: existing } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.id)
            .single();

        if (existing?.stripe_product_id) {
            console.log('✅ Found existing product in Supabase.');
            stripeProductId = existing.stripe_product_id;
            stripePriceId = existing.stripe_price_id;
        } else {
            // 2. Create in Stripe
            console.log('💳 Creating product in Stripe...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                metadata: {
                    cj_product_id: PRODUCT.id,
                    category: PRODUCT.category,
                    supplier: PRODUCT.supplier
                }
                // Note: Skipping images for Stripe as they are local
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.price * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`💵 Created Stripe Price: $${PRODUCT.price}`);
        }

        // 3. Upsert to Supabase
        console.log('💾 Saving to Supabase...');
        const variant = {
            id: PRODUCT.id,
            sku: `QK-${PRODUCT.id}-VAR`,
            price: PRODUCT.price,
            image: PRODUCT.images[0],
            options: { Color: 'Beige', Size: 'M' }
        };

        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: PRODUCT.id,
                name: PRODUCT.name,
                description: PRODUCT.description,
                price: PRODUCT.price,
                images: PRODUCT.images,
                cj_sku: `QK-${PRODUCT.id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: PRODUCT.options,
                variants: [variant],
                inventory: 50,
                is_active: true,
                category: PRODUCT.category,
                gender: PRODUCT.gender,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log('✅ Product successfully added to Supabase!');

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

main();
