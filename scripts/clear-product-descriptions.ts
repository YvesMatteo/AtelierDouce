// Script to clear product descriptions (iterative fix)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDescriptions() {
    console.log('Clearing all product descriptions to remove duplicate text...');

    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name');

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
    }

    console.log(`Found ${products.length} products to clear.`);

    for (const product of products) {
        // Set description to empty string
        const { error: updateError } = await supabase
            .from('products')
            .update({ description: '' })
            .eq('id', product.id);

        if (updateError) {
            console.error(`Error updating ${product.name}:`, updateError.message);
        } else {
            console.log(`Cleared description for: ${product.name}`);
        }
    }

    console.log('✅ Successfully cleared all product descriptions!');
}

clearDescriptions().catch(console.error);
