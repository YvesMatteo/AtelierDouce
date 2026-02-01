import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const PRODUCT_ID = 'd9e478e7-2e72-4b34-987f-7fed63572326';
const IMAGE_PATH = '/Users/yvesromano/.gemini/antigravity/brain/59c42ed8-b3a9-4e4f-94c4-8760288a980a/uploaded_media_1_1769869684276.png';

async function main() {
    console.log('📸 Uploading image to Supabase storage...');

    // Read the file
    const fileBuffer = fs.readFileSync(IMAGE_PATH);
    const fileName = `leggings-lifestyle-${Date.now()}.png`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error('Upload error:', uploadError.message);

        // Try to create the bucket if it doesn't exist
        if (uploadError.message.includes('not found')) {
            console.log('Creating bucket...');
            await supabase.storage.createBucket('product-images', { public: true });

            const { error: retryError } = await supabase.storage
                .from('product-images')
                .upload(fileName, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (retryError) {
                console.error('Retry upload error:', retryError.message);
                return;
            }
        } else {
            return;
        }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

    console.log('✅ Uploaded! URL:', publicUrl);

    // Get current product
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', PRODUCT_ID)
        .single();

    if (!product) {
        console.error('Product not found!');
        return;
    }

    // Update images array - add new image at the beginning
    const newImages = [publicUrl, ...(product.images || [])];

    console.log('📝 Updating product images...');

    // Update Supabase
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', PRODUCT_ID);

    if (updateError) {
        console.error('Update error:', updateError.message);
        return;
    }
    console.log('✅ Updated Supabase');

    // Update Stripe
    if (product.stripe_product_id) {
        await stripe.products.update(product.stripe_product_id, {
            images: newImages.slice(0, 8)
        });
        console.log('✅ Updated Stripe');
    }

    console.log('\n✨ Done! New main image set.');
}

main().catch(console.error);
