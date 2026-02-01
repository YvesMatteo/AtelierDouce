
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CANONICAL_CATEGORIES = ['Clothing', 'Shoes', 'Bags', 'Jewelry', 'Accessories'];

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, description');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    const nonCanonical = products.filter(p => !CANONICAL_CATEGORIES.includes(p.category));

    if (nonCanonical.length === 0) {
        console.log('All products are in canonical categories!');
        return;
    }

    console.log(`Found ${nonCanonical.length} products with non-canonical categories:`);
    nonCanonical.forEach(p => {
        console.log(`- [${p.category}] ${p.name}`);
    });
}

main();
