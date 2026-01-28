import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_ID = '1735282529143365632'; // Chessboard Plaid Knitted Hat
const IMAGE_URL = 'https://atelierdouce.shop/product-images/chessboard-hat-white.png';

async function update() {
    console.log(`Updating product ${PRODUCT_ID} with new image...`);

    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('cj_product_id', PRODUCT_ID)
        .single();

    if (fetchError || !product) {
        console.error('Error fetching product:', fetchError);
        return;
    }

    let currentImages = product.images || [];
    // Remove if it's already there to avoid dupes
    currentImages = currentImages.filter((img: string) => img !== IMAGE_URL);

    // Prepend new image
    const newImages = [IMAGE_URL, ...currentImages];

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('cj_product_id', PRODUCT_ID);

    if (updateError) {
        console.error('Error updating product:', updateError);
    } else {
        console.log('✅ Product updated successfully!');
        console.log('New Images:', newImages);
    }
}

update();
