import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    const productId = 'a6d7d176-ea9e-4070-b0d1-11cc05ef283d';

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
    console.log('Current images:');
    const currentImages = product.images as string[];
    currentImages.forEach((img: string, i: number) => {
        console.log('  ' + i + ': ' + img);
    });

    // The model image that needs to be removed (based on screenshot, it's the one with person wearing earring)
    // Looking at the visible thumbnails, the model image is: 1618206790594.jpg
    const modelImageUrl = 'https://cf.cjdropshipping.com/1618206790594.jpg';

    // Filter out the model image
    const newImages = currentImages.filter(img => img !== modelImageUrl);

    console.log('\nNew images order (after removing model):');
    newImages.forEach((img: string, i: number) => {
        console.log('  ' + i + ': ' + img);
    });

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

    console.log('\n✨ Done! Hard refresh the page (Cmd+Shift+R) to see changes.');
}

main().catch(console.error);
