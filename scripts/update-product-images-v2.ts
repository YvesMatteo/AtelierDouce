import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getCJClient } from '../lib/cjdropshipping';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function updateImages() {
    console.log('Starting image updates...');

    // 1. Update Brown Fur Jacket (Warm Hooded Jacket)
    // CJ ID: 7FE80359-83EB-412E-BB50-F8C4DB86E1AA
    // Use local uploaded image.
    const brownJacketId = '7FE80359-83EB-412E-BB50-F8C4DB86E1AA';
    const newBrownImage = 'https://atelierdouce.shop/product-images/brown-fur-jacket-white.png';

    console.log(`\nUpdating Brown Jacket (${brownJacketId})...`);

    const { data: brownProduct, error: brownError } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', brownJacketId)
        .single();

    if (brownError) {
        console.error('Error finding brown jacket:', brownError);
    } else {
        const currentImages = brownProduct.images || [];
        // Add new image to the front
        const updatedImages = [newBrownImage, ...currentImages.filter((img: string) => img !== newBrownImage)];

        const { error: updateError } = await supabase
            .from('products')
            .update({ images: updatedImages })
            .eq('id', brownProduct.id);

        if (updateError) console.error('Error updating brown jacket images:', updateError);
        else console.log('✅ Brown jacket updated with white background image.');
    }

    // 2. Update Blue Puffer Jacket (Casual Hooded Cotton Puffer Jacket)
    // CJ ID: 2411190554561614400 
    // We need to check images and put front-facing first.
    // Based on product_images.md, it seems index 1 is often the front one if index 0 is back.
    // Let's inspect first.
    const blueJacketCJId = '2411190554561614400';
    console.log(`\nUpdating Blue Jacket (${blueJacketCJId})...`);

    const { data: blueProduct, error: blueError } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', blueJacketCJId)
        .single();

    if (blueError) {
        console.error('Error finding blue jacket:', blueError);
    } else {
        const images = blueProduct.images || [];
        console.log('Current Blue Jacket Images:', images);

        if (images.length > 1) {
            // Heuristic: Swap 0 and 1 if 1 looks like a front image (usually is in these CJ datasets)
            // Or just move index 1 to 0.
            const newImages = [...images];
            const potentialFront = newImages[1];

            // Remove it from current position and put at start
            newImages.splice(1, 1);
            newImages.unshift(potentialFront);

            const { error: updateBlueError } = await supabase
                .from('products')
                .update({ images: newImages })
                .eq('id', blueProduct.id);

            if (updateBlueError) console.error('Error updating blue jacket:', updateBlueError);
            else console.log('✅ Blue jacket images reordered (Index 1 moved to 0).');
        } else {
            console.log('Not enough images to reorder for blue jacket.');
        }
    }
}

updateImages().catch(console.error);
