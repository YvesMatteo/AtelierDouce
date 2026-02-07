
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Product Details
const PRODUCT = {
    id: '013894EA-BB3F-40BF-BCCE-61751D3ED6E4', // QKSource ID
    name: "Artificial Fur Coat Jacket",
    description: "Artificial Fur Coat Jacket. Style: Light cooking. Fabric composition: Artificial fur. Available in multiple colors including Pink, Grey, Light tan, Light grey, White, Brown, Deep coffee color, Black.",
    price: 49.95,
    images: [
        "/products/artificial-fur-coat/1.jpg",
        "/products/artificial-fur-coat/2.jpg",
        "/products/artificial-fur-coat/3.jpg",
        "/products/artificial-fur-coat/4.jpg"
    ],
    category: 'Clothing',
    supplier: 'Qksource',
    gender: 'Woman',
    options: [
        { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
        { name: 'Color', values: ['Pink', 'Grey', 'Light tan', 'Light grey', 'White', 'Brown', 'Deep coffee color', 'Black'] }
    ]
};

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log(`🚀 Starting product add for: ${PRODUCT.name}`);

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

        // Generate variants
        const variants = [];
        for (const color of PRODUCT.options[1].values) {
            for (const size of PRODUCT.options[0].values) {
                variants.push({
                    id: `${PRODUCT.id}-${color.replace(/\s+/g, '-').toLowerCase()}-${size.toLowerCase()}`,
                    sku: `QK-${PRODUCT.id}-${color.substring(0, 3).toUpperCase()}-${size}`,
                    price: PRODUCT.price,
                    image: PRODUCT.images[0],
                    options: { Color: color, Size: size }
                });
            }
        }

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
                variants: variants,
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
