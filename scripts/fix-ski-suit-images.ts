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

const PRODUCT_ID = 'd1cf713c-5d86-4537-a5a4-8d7f4927f672';

// Remove the blonde woman image (2401130230310321900.jpg) - keep remaining 3 images
const IMAGES_TO_KEEP = [
    'https://cf.cjdropshipping.com/17051040/2401130230310320700.jpg',
    'https://cf.cjdropshipping.com/17051040/2401130230310321400.jpg',
    'https://cf.cjdropshipping.com/17051040/2401130230310322400.jpg',
];

async function main() {
    console.log('🖼️  Removing image from Ski Suit...');

    // Update Supabase
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: IMAGES_TO_KEEP })
        .eq('id', PRODUCT_ID);

    if (updateError) {
        console.error('Supabase error:', updateError.message);
        return;
    }
    console.log('✅ Updated Supabase');

    // Update Stripe
    await stripe.products.update('prod_TtRyb9Wz391owL', {
        images: IMAGES_TO_KEEP
    });
    console.log('✅ Updated Stripe');

    console.log('\n✨ Done! Removed the image.');
}

main().catch(console.error);
