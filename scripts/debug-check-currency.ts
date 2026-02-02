import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function checkPriceCurrency() {
    const { data: products } = await supabase
        .from('products')
        .select('stripe_price_id')
        .not('stripe_price_id', 'is', null)
        .limit(3);

    if (!products || products.length === 0) {
        console.log('No products with stripe_price_id found');
        return;
    }

    for (const p of products) {
        try {
            const price = await stripe.prices.retrieve(p.stripe_price_id);
            console.log(`Price ID: ${price.id}, Currency: ${price.currency}, Amount: ${price.unit_amount}`);
        } catch (e: any) {
            console.log(`Error retrieving price ${p.stripe_price_id}: ${e.message}`);
        }
    }
}

checkPriceCurrency();
