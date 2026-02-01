import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_ID = '185854e0-e0fc-4c87-a3c3-98caddedfbfb';
const NEW_IMAGE_PATH = '/product-images/imitation-cashmere-scarf-main.jpg';

async function updateScarfImage() {
    console.log(`Fetching product ${PRODUCT_ID}...`);

    // 1. Get current product to get existing images
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', PRODUCT_ID)
        .single();

    if (fetchError) {
        console.error('Error fetching product:', fetchError);
        return;
    }

    if (!product) {
        console.error('Product not found');
        return;
    }

    console.log('Current images:', product.images);

    // 2. Prepend new image
    const currentImages = product.images || [];
    // Check if already added to avoid duplicates if run multiple times
    const newImages = currentImages.includes(NEW_IMAGE_PATH)
        ? currentImages
        : [NEW_IMAGE_PATH, ...currentImages];

    console.log('New images list:', newImages);

    // 3. Update product
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', PRODUCT_ID);

    if (updateError) {
        console.error('Error updating product:', updateError);
    } else {
        console.log('✅ Product updated successfully!');
    }
}

updateScarfImage();
