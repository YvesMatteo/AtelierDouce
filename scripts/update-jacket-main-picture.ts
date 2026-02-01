
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateJacketImage() {
    const productId = '52193140-47b1-4b2a-9355-84178aa0f4d6';
    const localImagePath = '/Users/yvesromano/.gemini/antigravity/brain/48fcf43e-9ad8-4d42-a040-281813d4314d/uploaded_media_1769957888003.png';

    // 1. Upload Image
    console.log('📤 Reading local image...');
    if (!fs.existsSync(localImagePath)) {
        console.error(`❌ Image file not found at: ${localImagePath}`);
        return;
    }

    const fileBuffer = fs.readFileSync(localImagePath);
    const fileName = `3d-jacket-main-${Date.now()}.png`;

    console.log(`🚀 Uploading to Supabase Storage as ${fileName}...`);

    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('products')
        .upload(fileName, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        return;
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from('products')
        .getPublicUrl(fileName);

    console.log(`✅ Image uploaded: ${publicUrl}`);

    // 2. Update Product
    console.log('🔄 Fetching product...');
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

    if (fetchError) {
        console.error('❌ Failed to fetch product:', fetchError);
        return;
    }

    if (!product) {
        console.error('❌ Product not found');
        return;
    }

    const currentImages = product.images || [];
    // Prepend the new image
    const newImages = [publicUrl, ...currentImages];

    console.log('💾 Updating product record...');
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', productId);

    if (updateError) {
        console.error('❌ Update failed:', updateError);
        return;
    }

    console.log('🎉 Successfully updated "3D Effect Patterned Jacket" main image!');
}

updateJacketImage();
