import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("Fetching products...");
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${products.length} products.`);
    if (products.length > 0) {
        console.log("Sample Product Keys:", Object.keys(products[0]));
        console.log("Sample Product Data:", products[0]);
    }
}

main().catch(console.error);
