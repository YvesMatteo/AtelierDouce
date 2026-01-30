
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

// The ID to remove (duplicate)
// One was -TOP, one was -BOT. 
// "B4158AAB-B1EE-431B-A468-D1BA8085452B-BOT" seems less relevant if it's a full suit?
// But they have same images.
// Let's remove the one with Supabase ID "7e3b0d7b..." (which was -BOT)
const DUPLICATE_ID = '7e3b0d7b-7965-49a7-83be-66a3071a6fbe';

async function deleteDuplicate() {
    console.log(`🗑️ Deleting duplicate product: ${DUPLICATE_ID}...`);

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
