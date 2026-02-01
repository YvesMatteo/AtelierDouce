import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const targetUrl = "https://cf.cjdropshipping.com/quick/product/08a4a844-eb54-41cf-b528-bf4f39af69bc.jpg";
const productName = "Timeless Camel Wool Coat";

async function removeImage() {
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
    const currentImages = product.images || [];

    if (!currentImages.includes(targetUrl)) {
        console.log("Target image URL not found in product.");
        console.log("Current images:", currentImages);
        return;
    }

    const newImages = currentImages.filter((img: string) => img !== targetUrl);
    console.log(`Removing image. Count: ${currentImages.length} -> ${newImages.length}`);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);

    if (updateError) {
        console.error("Error updating product:", updateError);
    } else {
        console.log("✅ Successfully removed image from product.");
    }
}

removeImage();
