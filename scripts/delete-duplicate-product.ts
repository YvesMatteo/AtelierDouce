
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

// The ID to remove
const DUPLICATE_ID = 'df0e4c82-0bc5-449a-9408-9f6ef091613e';

async function deleteDuplicate() {
    console.log(`🗑️ Deleting product: ${DUPLICATE_ID}...`);

    // Get details to remove from Stripe
    const { data: product } = await supabase.from('products').select('*').eq('id', DUPLICATE_ID).single();

    if (product) {
        // Delete from Supabase
        const { error } = await supabase.from('products').delete().eq('id', DUPLICATE_ID);
        if (error) console.error('Supabase delete error:', error);
        else console.log('✅ Deleted from Supabase.');

        // Delete from Stripe (archive)
        if (product.stripe_product_id) {
            try {
                await stripe.products.update(product.stripe_product_id, { active: false });
                console.log('✅ Archived in Stripe.');
            } catch (e: any) {
                console.error('Stripe error:', e.message);
            }
        }
    } else {
        console.log('Product not found or already deleted.');
    }
}

deleteDuplicate();
