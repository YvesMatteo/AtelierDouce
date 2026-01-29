/**
 * Add Thin Brushed Leggings Product from QkSource
 * Main image: User uploaded image
 * Additional images: First 3 from QkSource
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// Product Details
const PRODUCT = {
    id: '996BA858-DC7C-4405-9A62-9BF17218E6BE', // QkSource ID from URL
    name: 'Brushed Fleece Leggings',
    description: 'Premium brushed fleece leggings with a soft, warm interior. Perfect for winter wear, yoga, and casual outfits. Features a high-waisted fit for maximum comfort and style.',
    categoryId: 'Clothing',
    gender: 'Woman',
    retailPrice: 39.95,
    supplierPrice: 8.50,
    // Main image is user's uploaded image, followed by first 3 from QkSource
    images: [
        '/Users/yvesromano/.gemini/antigravity/brain/895606b1-e20a-4998-9fae-dba5a027abde/uploaded_media_1769687733360.png', // User's image - will be uploaded to Supabase Storage
        'https://cf.cjdropshipping.com/16008768/991098103420.jpg',
        'https://cf.cjdropshipping.com/20200924/7085839286614.jpg',
        'https://cf.cjdropshipping.com/20200924/919808308746.jpg'
    ],
    supplier: 'Qksource',
    qkSourceUrl: 'https://qksource.com/product/thin-brushed-leggings-p-996BA858-DC7C-4405-9A62-9BF17218E6BE.html'
};

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function uploadImageToSupabase(localPath: string): Promise<string | null> {
    try {
        console.log(`   📤 Uploading image from: ${localPath}`);

        // Read the file
        const fileBuffer = fs.readFileSync(localPath);
        const fileName = `products/leggings-main-${Date.now()}.png`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error('   ❌ Upload error:', error.message);
            return null;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        console.log(`   ✅ Uploaded successfully: ${urlData.publicUrl}`);
        return urlData.publicUrl;
    } catch (error: any) {
        console.error('   ❌ Failed to upload image:', error.message);
        return null;
    }
}

async function addProduct() {
    console.log(`🚀 Starting product add: ${PRODUCT.name}`);

    try {
        // 1. Upload the main image to Supabase Storage
        let finalImages: string[] = [];

        const localImagePath = PRODUCT.images[0];
        if (localImagePath.startsWith('/')) {
            const uploadedUrl = await uploadImageToSupabase(localImagePath);
            if (uploadedUrl) {
                finalImages.push(uploadedUrl);
            }
        }

        // Add the QkSource images
        finalImages.push(...PRODUCT.images.slice(1));

        console.log(`   📷 Final images array: ${finalImages.length} images`);

        // 2. Stripe Integration
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists in DB first to avoid duplicates
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.id)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB record');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                images: finalImages.slice(0, 8), // Stripe allows max 8 images
                metadata: {
                    cj_product_id: PRODUCT.id,
                    category: PRODUCT.categoryId,
                    gender: PRODUCT.gender,
                    supplier: PRODUCT.supplier,
                    qk_source_url: PRODUCT.qkSourceUrl
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.retailPrice * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${PRODUCT.retailPrice} (${sPrice.id})`);
        }

        // 3. Supabase Upsert
        const variant = {
            id: PRODUCT.id,
            sku: `QK-${PRODUCT.id}`,
            price: PRODUCT.retailPrice,
            image: finalImages[0],
            options: { Style: 'A' }
        };

        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: PRODUCT.id,
                name: PRODUCT.name,
                description: PRODUCT.description,
                price: PRODUCT.retailPrice,
                images: finalImages,
                cj_sku: `QK-${PRODUCT.id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: [
                    { name: 'Style', values: ['A', 'B', 'C'] }
                ],
                variants: [variant],
                inventory: 100,
                is_active: true,
                category: PRODUCT.categoryId,
                gender: PRODUCT.gender,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Synced to DB: ${PRODUCT.name}`);
        console.log(`\n✨ Product added successfully!`);
        console.log(`   Main image: User's uploaded winter photo`);
        console.log(`   Additional images: 3 from QkSource`);

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

addProduct().catch(console.error);
