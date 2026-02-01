import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function swapImages(name: string) {
    console.log(`Fetching product: "${name}"...`);
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name);

    if (error || !products?.length) {
        console.error('Product not found or error:', error);
        return;
    }

    const product = products[0];
    const currentImages = product.images || [];

    if (currentImages.length < 2) {
        console.error("Not enough images to swap.");
        return;
    }

    console.log("Current order:", [currentImages[0], currentImages[1]]);

    // Swap [0] and [1]
    const temp = currentImages[0];
    currentImages[0] = currentImages[1];
    currentImages[1] = temp;

    console.log("New order:    ", [currentImages[0], currentImages[1]]);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: currentImages })
        .eq('id', product.id);

    if (updateError) {
        console.error("Error updating product:", updateError);
    } else {
        console.log("✅ Successfully swapped images.");
    }
}

swapImages("Soft Cashmere Touch Scarf");
