
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("Fetching QkSource products...");
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier', 'Qksource'); // Accessing assuming 'Qksource' or similar capitalization

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${products.length} QkSource products.`);
    if (products.length > 0) {
        console.log("Sample QkSource Product Data:", products[0]);
    } else {
        // Try case insensitive or just check distinct suppliers
        const { data: allProducts } = await supabase.from('products').select('supplier');
        const suppliers = [...new Set(allProducts?.map(p => p.supplier))];
        console.log("Available suppliers:", suppliers);
    }
}

main().catch(console.error);
