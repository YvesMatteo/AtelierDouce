
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_ID = '2000862978889248769';
// This image appeared first in the productImageSet, indicating it's likely the intended main/front view
const TARGET_FRONT_IMAGE = 'https://cf.cjdropshipping.com/4ac2b171-c0d0-4249-8569-37c69e2fb278.jpg';

async function main() {
    console.log(`🖼️  Fixing image for product ${PRODUCT_ID}...`);

    // 1. Get current product
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', PRODUCT_ID)
        .single();

    if (error || !product) {
        console.error("❌ Product not found:", error);
        return;
    }

    let images = product.images || [];

    // 2. Check if target image exists in array
    const index = images.indexOf(TARGET_FRONT_IMAGE);

    if (index === -1) {
        console.warn("⚠️ Target image not found in current list. Adding it to front.");
        images.unshift(TARGET_FRONT_IMAGE);
    } else if (index === 0) {
        console.log("✅ Target image is already at the front.");
    } else {
        console.log(`🔄 Moving image from index ${index} to 0...`);
        // Remove from current position
        images.splice(index, 1);
        // Add to front
        images.unshift(TARGET_FRONT_IMAGE);
    }

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('products')
        .update({
            images: images,
            updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

    if (updateError) {
        console.error("❌ Error updating product:", updateError.message);
    } else {
        console.log("✅ Successfully updated product images!");
        console.log(`   New Main Image: ${images[0]}`);
    }
}

main();
