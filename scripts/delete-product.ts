
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const productIdToDelete = 'e7477ef0-0447-4620-a659-89454bbc8b86'; // The -bottoms version
    console.log(`Deleting product ID: ${productIdToDelete}`);

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productIdToDelete);

    if (error) {
        console.error('Error deleting product:', error);
    } else {
        console.log('Successfully deleted product.');
    }
}

main().catch(console.error);
