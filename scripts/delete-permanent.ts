
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

const TO_DELETE_CJ_IDS = [
    '1735282529143365632', // Chessboard Plaid Hat
    '1550458464835743744', // Octagonal Hat
];

async function main() {
    console.log('🗑️  Permanently deleting products...');

    for (const cjId of TO_DELETE_CJ_IDS) {
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('cj_product_id', cjId);

        if (!products || products.length === 0) {
            console.log(`Product with CJ ID ${cjId} not found in DB.`);
            continue;
        }

        for (const product of products) {
            console.log(`Deleting ${product.name} (${product.id})...`);

            if (product.stripe_product_id) {
                try {
                    await stripe.products.del(product.stripe_product_id);
                    console.log('  Deleted from Stripe');
                } catch (e: any) {
                    console.log(`  Stripe delete failed: ${e.message}`);
                    try {
                        await stripe.products.update(product.stripe_product_id, { active: false });
                        console.log('  Archived in Stripe');
                    } catch (e2) { }
                }
            }

            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (error) console.error('  Supabase delete failed:', error);
            else console.log('  Deleted from Supabase');
        }
    }
}

main().catch(console.error);
