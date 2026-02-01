import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const productName = "Solid Color Versatile Winter Warm Extended Tassel Scarf";

// Keep only the first image (the correct scarf)
const imagesToKeep = [
    "https://cf.cjdropshipping.com/quick/product/79846cf2-1632-4385-b771-6529c9e6b4ac.jpg"
];

async function setImages() {
    console.log(`Fetching product: "${productName}"...`);
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', productName);

    if (error || !products?.length) {
        console.error('Product not found or error:', error);
        return;
    }

    const product = products[0];
    console.log(`Found product: ${product.name} (ID: ${product.id})`);
    console.log(`Current images: ${product.images?.length}`);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: imagesToKeep })
        .eq('id', product.id);

    if (updateError) {
        console.error("Error updating product:", updateError);
    } else {
        console.log(`✅ Successfully updated images. New count: ${imagesToKeep.length}`);
    }
}

setImages();
