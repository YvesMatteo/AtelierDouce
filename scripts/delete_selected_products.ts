import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCTS_TO_DELETE = [
    "Bear Logo Pattern Bag",         // #4
    "Light Blue Nylon Windbreaker",  // #8
    "Plush Lined Winter Shoes",      // #14
    "Leisure Polyester Top",         // #21
    "3D Effect Patterned Jacket"     // #22
];

async function main() {
    console.log(`🗑️  Starting deletion for ${PRODUCTS_TO_DELETE.length} products...`);

    for (const productName of PRODUCTS_TO_DELETE) {
        // 1. Find the product
        const { data: products, error: findError } = await supabase
            .from('products')
            .select('id, name')
            .eq('name', productName);

        if (findError) {
            console.error(`❌ Error finding "${productName}":`, findError.message);
            continue;
        }

        if (!products || products.length === 0) {
            console.log(`⚠️  Product not found: "${productName}" - it may have already been deleted.`);
            continue;
        }

        // 2. Delete the product(s) - handling duplicates if any match exactly
        for (const product of products) {
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (deleteError) {
                console.error(`❌ Failed to delete "${productName}" (ID: ${product.id}):`, deleteError.message);
            } else {
                console.log(`✅ Deleted: "${product.name}" (ID: ${product.id})`);
            }
        }
    }

    console.log("\n✨ Deletion process complete.");
}

main();
