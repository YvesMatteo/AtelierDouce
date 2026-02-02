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

async function forceFixLuxeCoat() {
    console.log('🔧 Force finding Luxe Long Down Coat...\n');

    const { data: product, error } = await supabase
        .from('products')
        .select('name, stripe_product_id, stripe_price_id')
        .eq('name', 'Luxe Long Down Coat')
        .single();

    if (error || !product) {
        console.error('❌ Could not find product:', error);
        return;
    }

    console.log(`Product found: ${product.name}`);
    console.log(`Supabase Price ID: ${product.stripe_price_id}`);

    // Retrieve Stripe Product
    const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
    console.log(`Stripe Default Price: ${stripeProduct.default_price}`);

    if (stripeProduct.default_price !== product.stripe_price_id) {
        console.log(`🔄 Updating default price to ${product.stripe_price_id}...`);
        await stripe.products.update(product.stripe_product_id, {
            default_price: product.stripe_price_id as string,
        });
        console.log('✅ Default price updated.');
    } else {
        console.log('✅ Default price matches.');
    }

    // Now try to archive others
    const prices = await stripe.prices.list({
        product: product.stripe_product_id,
        active: true,
    });

    for (const price of prices.data) {
        if (price.id !== product.stripe_price_id) {
            console.log(`🔻 Archiving old price: ${price.id}`);
            await stripe.prices.update(price.id, { active: false });
        }
    }
}

forceFixLuxeCoat().catch(console.error);
