
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

const PRODUCT_IDS = [
    'c100dcb9-d706-4d8d-86e9-42a02e9c13b9', // Dark Brown Velboa Boots
    'cd23a97a-4712-4463-9c1f-8190decd32aa', // Winter Coat Warm Lapel Long Fluffy Faux Fur Coat
];

async function main() {
    console.log('🗑️  Deleting requested products...');

    for (const id of PRODUCT_IDS) {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !product) {
            console.log(`❌ Product ${id} not found in DB.`);
            continue;
        }

        console.log(`Attempting to delete: ${product.name} (${product.id})...`);

        // Handle Stripe
        if (product.stripe_product_id) {
            try {
                await stripe.products.del(product.stripe_product_id);
                console.log('  ✅ Deleted from Stripe');
            } catch (e: any) {
                console.log(`  ⚠️ Stripe delete failed: ${e.message}`);
                try {
                    await stripe.products.update(product.stripe_product_id, { active: false });
                    console.log('  ✅ Archived in Stripe (could not be deleted)');
                } catch (e2: any) {
                    console.log(`  ❌ Stripe archive failed: ${e2.message}`);
                }
            }
        }

        // Handle Supabase
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', product.id);

        if (deleteError) {
            console.error('  ❌ Supabase delete failed:', deleteError.message);
        } else {
            console.log('  ✅ Deleted from Supabase');
        }
    }
}

main().catch(console.error);
