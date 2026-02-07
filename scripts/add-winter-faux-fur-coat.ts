
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Product Details
const PRODUCT = {
    id: '2501070601131628700', // QKSource ID
    name: "Winter Coat Warm Lapel Long Fluffy Faux Fur Coat",
    description: "Winter Coat Warm Lapel Long Fluffy Faux Fur Coat Women Loose Long Sleeve Jacket Outerwear Clothing. Unique design, stylish and beautiful. Good material, comfortable wear. Features a variety of colors.",
    retailPrice: 49.95,
    supplierPrice: 16.42,
    images: [
        "https://oss-cf.cjdropshipping.com/product/2025/12/29/08/215ecd8a-6c18-42e0-ae7a-11531bd0c9bc.jpg",
        "https://cf.cjdropshipping.com/quick/product/ea345336-cf2a-4442-b2eb-c8316c58b671.jpg",
        "https://cf.cjdropshipping.com/quick/product/1770bc0d-7df8-47c4-9c6b-afbec84ada00.jpg",
        "https://cf.cjdropshipping.com/quick/product/8d8dfe88-3a23-414d-8b94-e044bc8569ef.jpg",
        "https://cf.cjdropshipping.com/quick/product/ff0ce287-e171-4a17-bcd6-31a240c93645.jpg",
        "https://cf.cjdropshipping.com/quick/product/312dbdcf-2e01-401c-a3fb-dda7db468615.jpg",
        "https://cf.cjdropshipping.com/quick/product/43b94fab-99bb-460c-9a59-259a7f608b18.jpg",
        "https://cf.cjdropshipping.com/quick/product/c2a92c6f-d3b3-432e-956c-d5e89eb5bd8e.jpg",
        "https://cf.cjdropshipping.com/quick/product/e8a20865-eeac-4413-b51b-adac591262ba.jpg"
    ],
    supplier: 'Qksource',
    category: 'Clothing',
    gender: 'Woman',
    options: [
        { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
        { name: 'Color', values: ['Picture color', 'Dark Brown', 'Dark Gray', 'Leopard Print'] }
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

async function addProduct() {
    console.log(`🚀 Starting product add for: ${PRODUCT.name}`);

    try {
        // 1. Stripe Integration
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists in DB first to avoid duplicates
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.id)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB record');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                images: PRODUCT.images.slice(0, 8), // Stripe limit
                metadata: {
                    cj_product_id: PRODUCT.id,
                    category: PRODUCT.category,
                    gender: PRODUCT.gender,
                    supplier: PRODUCT.supplier
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.retailPrice * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${PRODUCT.retailPrice} (${sPrice.id})`);
        }

        // 2. Supabase Upsert
        // Create variants based on options
        const variants = [];
        for (const color of PRODUCT.options[1].values) {
            for (const size of PRODUCT.options[0].values) {
                variants.push({
                    id: `${PRODUCT.id}-${color.replace(/\s+/g, '-').toLowerCase()}-${size.toLowerCase()}`,
                    sku: `QK-${PRODUCT.id}-${color.substring(0, 3).toUpperCase()}-${size}`,
                    price: PRODUCT.retailPrice,
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
                price: PRODUCT.retailPrice,
                images: PRODUCT.images,
                cj_sku: `QK-${PRODUCT.id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: PRODUCT.options,
                variants: variants,
                inventory: 100,
                is_active: true,
                category: PRODUCT.category,
                gender: PRODUCT.gender,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Synced to DB for ${PRODUCT.name}!`);

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

addProduct().catch(console.error);
