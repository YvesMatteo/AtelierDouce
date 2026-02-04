
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

const UPDATES = [
    {
        name: 'Navy Cloud Puffer Jacket',
        oldPrice: 149.00,
        newPrice: 89.00
    },
    {
        name: "Women's New Professional Double-board Waterproof Ski Suit",
        oldPrice: 399.00,
        newPrice: 459.00
    }
];

async function main() {
    console.log("🚀 Starting Price Updates...");

    for (const update of UPDATES) {
        console.log(`\nProcessing: ${update.name}`);

        // 1. Get Product from Supabase
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('name', update.name)
            .single();

        if (error || !product) {
            console.error(`   ❌ Product not found in DB: ${update.name}`);
            continue;
        }

        console.log(`   ✅ Found DB Product (ID: ${product.id}, Current Price: $${product.price})`);

        if (!product.stripe_product_id) {
            console.error(`   ❌ No Stripe Product ID found for ${update.name}`);
            continue;
        }

        // 2. Create new Stripe Price
        try {
            console.log(`   💳 Creating new Stripe Price: $${update.newPrice}`);
            const price = await stripe.prices.create({
                product: product.stripe_product_id,
                unit_amount: Math.round(update.newPrice * 100),
                currency: 'usd',
            });
            console.log(`   ✅ Created Stripe Price: ${price.id}`);

            // 3. Update Stripe Product Default Price (Optional but good for dashboard)
            await stripe.products.update(product.stripe_product_id, {
                default_price: price.id
            });
            console.log(`   ✅ Updated Stripe Product Default Price`);

            // 4. Update Supabase
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    price: update.newPrice,
                    stripe_price_id: price.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', product.id);

            if (updateError) {
                console.error(`   ❌ Failed to update Supabase: ${updateError.message}`);
            } else {
                console.log(`   ✅ Successfully updated Supabase record to $${update.newPrice}`);
            }

        } catch (e: any) {
            console.error(`   ❌ Stripe/Update Error: ${e.message}`);
        }
    }
    console.log("\n✨ Price updates complete.");
}

main().catch(console.error);
