
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, category')
        .or('category.is.null,category.eq.""');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('All products have categories!');
        return;
    }

    console.log(`Found ${products.length} uncategorized products:`);
    products.forEach(p => {
        console.log(`- [${p.id}] ${p.name} (Desc: ${p.description?.slice(0, 30)}...)`);
    });
}

main();
