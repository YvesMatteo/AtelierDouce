import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const productsToUpdate = [
    "Star Charm Necklace",
    "Pearl Minimal Necklace",
    "Vintage Metal Hoop Earrings"
];

const increaseAmount = 5;

async function updatePrices() {
    console.log(`Starting price increase of $${increaseAmount} for ${productsToUpdate.length} products...`);

    for (const name of productsToUpdate) {
        // 1. Find product
        const { data: products, error: findError } = await supabase
            .from('products')
            .select('*')
            .ilike('name', name);

        if (findError || !products?.length) {
            console.error(`❌ Product not found: "${name}"`, findError?.message || '');
            continue;
        }

        for (const product of products) {
            const oldPrice = product.price;
            const newPrice = oldPrice + increaseAmount;

            console.log(`Updating "${product.name}" (ID: ${product.id}). ${oldPrice} -> ${newPrice}`);

            // 2. Update product
            const { error: updateError } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', product.id);

            if (updateError) {
                console.error(`  ❌ Error updating product:`, updateError);
                continue;
            }

            // 3. Update variants
            if (product.variants && Array.isArray(product.variants)) {
                const updatedVariants = product.variants.map((v: any) => ({
                    ...v,
                    price: newPrice
                }));

                const { error: variantError } = await supabase
                    .from('products')
                    .update({ variants: updatedVariants })
                    .eq('id', product.id);

                if (variantError) {
                    console.error(`  ❌ Error updating variants:`, variantError);
                } else {
                    console.log(`  ✅ Successfully updated product and variants.`);
                }
            } else {
                console.log(`  ✅ Successfully updated product.`);
            }
        }
    }
}

updatePrices();
