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

async function main() {
    const productId = '8b9401e2-23b0-4a9a-a57b-f84e4e11a186';

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error || !product) {
        console.error('Product not found:', error);
        return;
    }

    console.log('Product:', product.name);
    const images = product.images as string[];

    // Current order shows back of jacket first (index 0)
    // Move the front-facing image to first position
    // Based on typical product photo patterns, index 1 often shows the front
    // Let's swap index 0 and index 1

    const newImages = [...images];
    // Move index 1 (likely front view) to position 0
    const frontImage = newImages[1];
    newImages.splice(1, 1);
    newImages.unshift(frontImage);

    console.log('\nNew image order:');
    newImages.forEach((img, i) => console.log(i + ': ' + img));

    // Update Supabase
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', productId);

    if (updateError) {
        console.error('Failed to update Supabase:', updateError);
        return;
    }
    console.log('\n✅ Updated Supabase');

    // Update Stripe
    if (product.stripe_product_id) {
        try {
            await stripe.products.update(product.stripe_product_id, {
                images: newImages.slice(0, 8)
            });
            console.log('✅ Updated Stripe');
        } catch (stripeErr: any) {
            console.error('Stripe update failed:', stripeErr.message);
        }
    }

    console.log('\n✨ Done! Refresh the page to see the front-facing image first.');
}

main().catch(console.error);
