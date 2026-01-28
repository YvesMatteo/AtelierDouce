import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_ID = '0045f0b5-cb0b-448b-80b8-fb679f042709';

async function deleteImage() {
    console.log(`Fetching product ${PRODUCT_ID}...`);
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', PRODUCT_ID)
        .single();

    if (fetchError || !product) {
        console.error('Error fetching product:', fetchError);
        return;
    }

    const currentImages = product.images || [];
    if (currentImages.length === 0) {
        console.log('No images to delete.');
        return;
    }

    const removedImage = currentImages[0];
    const newImages = currentImages.slice(1);

    console.log(`Removing image: ${removedImage}`);
    console.log(`Remaining images count: ${newImages.length}`);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', PRODUCT_ID);

    if (updateError) {
        console.error('Error updating product:', updateError);
    } else {
        console.log('✅ Top image removed successfully!');
    }
}

deleteImage();
