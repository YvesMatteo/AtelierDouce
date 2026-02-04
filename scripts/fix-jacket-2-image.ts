
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_ID = '2411190554561614400';
// Reverting to the image that was in product_links.md previously, assuming it's the front-facing one.
const TARGET_FRONT_IMAGE = 'https://cf.cjdropshipping.com/quick/product/26d11536-8175-4bf4-a58b-8a34e37c779a.jpg';

async function main() {
    console.log(`🖼️  Fixing image for product ${PRODUCT_ID}...`);

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
    const index = images.indexOf(TARGET_FRONT_IMAGE);

    if (index === -1) {
        console.warn("⚠️ Target image not found in current list. Adding it to front.");
        images.unshift(TARGET_FRONT_IMAGE);
    } else if (index === 0) {
        console.log("✅ Target image is already at the front.");
    } else {
        console.log(`🔄 Moving image from index ${index} to 0...`);
        images.splice(index, 1);
        images.unshift(TARGET_FRONT_IMAGE);
    }

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
