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

const PRODUCT_ID = '208be477-c131-4334-9ed0-5eaf85abfc40';
const STRIPE_ID = 'prod_Ts4H7njDfmd4D7';

// Remove the image with the hat (bd206f0c...) - keep remaining images
const IMAGES_TO_KEEP = [
    'https://cf.cjdropshipping.com/quick/product/016908ff-be6e-470d-820a-a2cff70a62f6.jpg',
    'https://cf.cjdropshipping.com/quick/product/5689413f-e171-4cdd-be7f-f1cdccbb490d.jpg',
    'https://cf.cjdropshipping.com/quick/product/f7b9cfa2-5739-4173-a40c-9dd9eedca775.jpg',
    'https://cf.cjdropshipping.com/quick/product/e9b30633-fe5c-4ce3-b5f1-8fb5f8b70d5c.jpg',
];

async function main() {
    console.log('🖼️  Removing image from Microfiber Casual Shoes...');

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
    await stripe.products.update(STRIPE_ID, {
        images: IMAGES_TO_KEEP
    });
    console.log('✅ Updated Stripe');

    console.log('\n✨ Done! Removed the hat image.');
}

main().catch(console.error);
