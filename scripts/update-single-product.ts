import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function updateSingleProduct(name: string, newPrice: number) {
    console.log(`Searching for product: "${name}"...`);

    // 1. Find the product
    const { data: products, error: findError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name);

    if (findError) {
        console.error('Error finding product:', findError);
        return;
    }

    if (!products || products.length === 0) {
        console.error('Product not found.');
        return;
    }

    if (products.length > 1) {
        console.warn(`Found ${products.length} products matching "${name}". Updating ALL of them.`);
    }

    for (const product of products) {
        console.log(`Found product: ${product.name} (ID: ${product.id}). Current Price: ${product.price}`);

        // 2. Update the product
        const { data: updated, error: updateError } = await supabase
            .from('products')
            .update({ price: newPrice })
            .eq('id', product.id)
            .select();

        if (updateError) {
            console.error(`Error updating product ${product.id}:`, updateError);
        } else {
            console.log(`✅ Successfully updated product "${updated[0].name}" to price: ${updated[0].price}`);
        }

        // 3. Update variants if they exist
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
                console.error(`Error updating variants for ${product.id}:`, variantError);
            } else {
                console.log(`✅ Successfully updated variants for product "${product.name}"`);
            }
        }
    }
}

const productName = "Timeless Camel Wool Coat";
const targetPrice = 79;

updateSingleProduct(productName, targetPrice);
