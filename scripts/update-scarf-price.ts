import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const productName = "Solid Color Versatile Winter Warm Extended Tassel Scarf";
const newPrice = 24;

async function updatePrice() {
    console.log(`Fetching product: "${productName}"...`);
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', productName);

    if (fetchError || !products?.length) {
        console.error('Product not found or error:', fetchError);
        return;
    }

    const product = products[0];
    console.log(`Found product: ${product.name} (ID: ${product.id})`);

    // Update variants prices
    const updatedVariants = (product.variants || []).map((v: any) => ({
        ...v,
        price: newPrice
    }));

    console.log(`Updating main price to $${newPrice} and ${updatedVariants.length} variants...`);

    const { error: updateError } = await supabase
        .from('products')
        .update({
            price: newPrice,
            variants: updatedVariants
        })
        .eq('id', product.id);

    if (updateError) {
        console.error("Error updating product:", updateError);
    } else {
        console.log(`✅ Successfully updated price to $${newPrice}`);
    }
}

updatePrice();
