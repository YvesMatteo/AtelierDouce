import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const productId = "4c4dede1-6a12-4461-bc15-eb88fe859314";

async function removeAVariants() {
    console.log(`Fetching product: ${productId}...`);

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error || !product) {
        console.error('Product not found or error:', error);
        return;
    }

    console.log(`Found product: ${product.name}`);
    const currentVariants = product.variants || [];
    console.log(`Current variants count: ${currentVariants.length}`);

    // Filter out variants where Color ends with " A"
    const filteredVariants = currentVariants.filter((v: any) => {
        const color = v.options?.Color || '';
        const endsWithA = color.trim().endsWith(' A');
        if (endsWithA) {
            console.log(`  Removing: ${color}`);
        }
        return !endsWithA;
    });

    console.log(`\nNew variants count: ${filteredVariants.length}`);

    // Update the product
    const { error: updateError } = await supabase
        .from('products')
        .update({ variants: filteredVariants })
        .eq('id', productId);

    if (updateError) {
        console.error("Error updating product:", updateError);
    } else {
        console.log(`✅ Successfully removed ${currentVariants.length - filteredVariants.length} variants.`);
    }
}

removeAVariants();
