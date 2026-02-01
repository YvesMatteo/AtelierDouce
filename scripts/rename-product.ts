import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OLD_NAME = "3D Effect Patterned Jacket";
const NEW_NAME = "Navy Cloud Puffer Jacket";
const NEW_PRICE = 89;

async function renameAndReprice() {
    console.log(`Fetching product: "${OLD_NAME}"...`);

    // 1. Find product
    const { data: products, error: findError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', OLD_NAME);

    if (findError) {
        console.error('Error finding product:', findError);
        return;
    }

    if (!products || products.length === 0) {
        console.error(`Product "${OLD_NAME}" not found.`);
        return;
    }

    const product = products[0];
    console.log(`Found product: ${product.name} (ID: ${product.id}). Price: ${product.price}`);

    // 2. Update product
    const { error: updateError } = await supabase
        .from('products')
        .update({
            name: NEW_NAME,
            price: NEW_PRICE
        })
        .eq('id', product.id);

    if (updateError) {
        console.error(`Error updating product:`, updateError);
        return;
    }

    console.log(`✅ Successfully updated product to "${NEW_NAME}" - $${NEW_PRICE}`);

    // 3. Update variants
    if (product.variants && Array.isArray(product.variants)) {
        const updatedVariants = product.variants.map((v: any) => ({
            ...v,
            price: NEW_PRICE
        }));

        const { error: variantError } = await supabase
            .from('products')
            .update({ variants: updatedVariants })
            .eq('id', product.id);

        if (variantError) {
            console.error(`Error updating variants:`, variantError);
        } else {
            console.log(`✅ Successfully updated variants.`);
        }
    }
}

renameAndReprice();
