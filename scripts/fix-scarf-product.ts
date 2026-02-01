
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const PRODUCT = {
    cj_id: '2412070355501627400',
    name: 'Solid Color Versatile Winter Warm Extended Tassel Scarf',
    description: 'Wrap yourself in elegance and warmth with our Solid Color Versatile Winter Warm Extended Tassel Scarf. Crafted from soft, high-quality material, this scarf features a classic design with stylish tassels, making it the perfect accessory for any winter outfit.',
    price: 12.95, // Increased slightly for better margin perception/premium feel
    category: 'Accessories',
    supplier: 'Qksource',
    images: [
        'https://cf.cjdropshipping.com/quick/product/79846cf2-1632-4385-b771-6529c9e6b4ac.jpg',
        'https://cf.cjdropshipping.com/quick/product/55beaa6d-3079-4590-8845-e3bdfb33e83d.jpg', // Another good image if available, reusing from similar
        'https://cf.cjdropshipping.com/quick/product/c7918926-922b-49e1-9018-9cebc0bbf668.jpg'
    ],
    colors: ['Beige', 'Black', 'Grey', 'Red', 'Camel'],
    cj_sku: 'CJ-SCARF-TASSEL-001'
};

async function fixProduct() {
    console.log(`🚀 Fixing Product: ${PRODUCT.name} (${PRODUCT.cj_id})`);

    try {
        // 1. Stripe Setup
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists in DB to reuse Stripe ID if present
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.cj_id)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB');
            stripeProductId = existingProduct.stripe_product_id;
            // Create new price to match current setting
            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.price * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                images: PRODUCT.images,
                metadata: {
                    cj_product_id: PRODUCT.cj_id,
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
            console.log(`   💵 Stripe Price Created: $${PRODUCT.price}`);
        }

        // 2. Prepare Variant
        const mainVariant = {
            id: PRODUCT.cj_id,
            sku: PRODUCT.cj_sku,
            price: PRODUCT.price,
            image: PRODUCT.images[0],
            options: { Color: PRODUCT.colors[0] }
        };

        // 3. Upsert to Supabase
        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: PRODUCT.cj_id,
                name: PRODUCT.name,
                description: PRODUCT.description,
                price: PRODUCT.price,
                images: PRODUCT.images,
                cj_sku: PRODUCT.cj_sku,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: [
                    { name: 'Color', values: PRODUCT.colors }
                ],
                variants: [mainVariant],
                inventory: 100,
                is_active: true, // Force active
                category: PRODUCT.category,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Successfully upserted to Supabase!`);

    } catch (e: any) {
        console.error(`   ❌ Error:`, e.message);
    }
}

fixProduct().catch(console.error);
