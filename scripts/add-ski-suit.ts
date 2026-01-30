
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import fs from 'fs';
import { randomUUID } from 'crypto';

const IMAGES = JSON.parse(fs.readFileSync('images.json', 'utf-8'));

// Common Product Data
const PRODUCT_BASE = {
    cj_id_base: 'B4158AAB-B1EE-431B-A468-D1BA8085452B',
    name: 'Winter Outdoor Body Hoodie Ski Suit Coat Women',
    description: 'Stay warm and stylish with this premium Winter Outdoor Body Hoodie Ski Suit. Featuring a waterproof design, warm insulation, and a fashionable faux fur hood. Perfect for skiing, snowboarding, or cold winter days.',
    price: 99.00,
    gender: 'Woman',
    supplier: 'Qksource',
    colors: ['Black', 'Blue', 'Navy Blue', 'Pink', 'Yellow'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
};

const CATEGORIES = ['Tops', 'Bottom'];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function addProductVariant(category: string, suffix: string) {
    const cj_id = `${PRODUCT_BASE.cj_id_base}-${suffix}`;
    const sku = `QK-${PRODUCT_BASE.cj_id_base}-${suffix}`;
    const name = PRODUCT_BASE.name; // Keep name clean as requested? Or append? User said "add to both", usually means same product appears in both. DB limitation -> Duplicate rows. Same Name is best for UI.

    console.log(`\n🚀 Adding Product for Category: ${category}`);

    try {
        // 1. Check/Create Stripe Product
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check DB first
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', cj_id)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: name,
                description: PRODUCT_BASE.description,
                images: IMAGES.slice(0, 8), // Stripe limit 8 images usually
                metadata: {
                    cj_product_id: cj_id,
                    category: category,
                    gender: PRODUCT_BASE.gender,
                    supplier: PRODUCT_BASE.supplier
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT_BASE.price * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${PRODUCT_BASE.price}`);
        }

        // 2. Prepare Variants (One for each Color/Size combo or just a list?)
        // The previous script used a simplified variants array.
        // We will create a representative variant for the main row, and the JSON options column handles flexibility.

        const mainVariant = {
            id: cj_id,
            sku: sku,
            price: PRODUCT_BASE.price,
            image: IMAGES[0],
            options: { Color: PRODUCT_BASE.colors[0], Size: PRODUCT_BASE.sizes[0] }
        };

        // 3. Upsert to Supabase
        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: cj_id, // Unique ID for this entry
                name: name,
                description: PRODUCT_BASE.description,
                price: PRODUCT_BASE.price,
                images: IMAGES,
                cj_sku: sku,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: [
                    { name: 'Color', values: PRODUCT_BASE.colors },
                    { name: 'Size', values: PRODUCT_BASE.sizes }
                ],
                variants: [mainVariant],
                inventory: 100,
                is_active: true,
                category: category,
                gender: PRODUCT_BASE.gender,
                supplier: PRODUCT_BASE.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' }); // Conflict on cj_product_id

        if (error) throw error;
        console.log(`   ✅ Successfully added to Supabase in category ${category}`);

    } catch (e: any) {
        console.error(`   ❌ Error adding to ${category}:`, e.message);
    }
}

async function main() {
    // Add to 'Bottom' (or 'Bottoms'?) let's use user's words "bottom and tops"
    // I will capitalize them.
    await addProductVariant('Tops', 'TOP');
    await addProductVariant('Bottom', 'BOT');
}

main().catch(console.error);
