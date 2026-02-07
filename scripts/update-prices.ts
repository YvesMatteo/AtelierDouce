
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRODUCTS_TO_UPDATE = [
    {
        id: 'faux-fur-coat-2026', // Luxurious Faux Fur Coat
        newPrice: 69.00
    }
];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🚀 Starting price updates...');

    for (const item of PRODUCTS_TO_UPDATE) {
        try {
            console.log(`\nProcessing product ${item.id}...`);

            // 1. Get product from Supabase to find Stripe Product ID
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('cj_product_id', item.id)
                .single();

            if (error || !product) {
                console.error(`❌ Product not found in Supabase: ${item.id}`);
                continue;
            }

            console.log(`Found product: ${product.name}`);

            // 2. Create new Stripe Price
            if (product.stripe_product_id) {
                console.log(`Creating new Stripe price for product ${product.stripe_product_id}...`);
                const newPrice = await stripe.prices.create({
                    product: product.stripe_product_id,
                    unit_amount: Math.round(item.newPrice * 100),
                    currency: 'usd',
                });
                console.log(`✅ Created new Stripe Price ID: ${newPrice.id}`);

                // 3. Update Supabase with new price and stripe_price_id
                const { error: updateError } = await supabase
                    .from('products')
                    .update({
                        price: item.newPrice,
                        stripe_price_id: newPrice.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('cj_product_id', item.id);

                if (updateError) {
                    console.error(`❌ Failed to update Supabase: ${updateError.message}`);
                } else {
                    console.log(`✅ Updated Supabase record to $${item.newPrice}`);
                }
            } else {
                console.error(`❌ No Stripe Product ID found for ${item.id}`);
            }

        } catch (e: any) {
            console.error(`❌ Error processing ${item.id}:`, e.message);
        }
    }
}

main();
