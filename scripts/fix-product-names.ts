
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { cleanProductName } from './utils';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🚀 Starting to fix product names...\n');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stripe_product_id');

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error?.message);
        return;
    }

    console.log(`📋 Found ${products.length} products to check.`);

    for (const product of products) {
        const oldName = product.name;
        // If the name is already clean (no non-ASCII, no junk, length ok), we might still want to deduplicate
        const newName = cleanProductName(oldName);

        if (oldName !== newName) {
            console.log(`\n🔄 Updating: "${oldName}" -> "${newName}"`);

            // 1. Update Supabase
            const { error: upError } = await supabase
                .from('products')
                .update({ name: newName })
                .eq('id', product.id);

            if (upError) {
                console.error(`   ❌ Supabase update failed: ${upError.message}`);
            } else {
                console.log(`   ✅ Supabase updated.`);
            }

            // 2. Update Stripe
            if (product.stripe_product_id) {
                try {
                    await stripe.products.update(product.stripe_product_id, {
                        name: newName
                    });
                    console.log(`   ✅ Stripe updated.`);
                } catch (sErr: any) {
                    console.error(`   ⚠️ Stripe update failed: ${sErr.message}`);
                }
            }
        } else {
            console.log(`\n✅ Already clean: "${oldName}"`);
        }
    }

    console.log('\n✨ Finished fixing product names.');
}

main().catch(console.error);
