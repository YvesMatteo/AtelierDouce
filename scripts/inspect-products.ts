import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listAllProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, price');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (products && products.length > 0) {
        products.forEach(p => {
            console.log(`"${p.name}" - ${p.price}`);
        });
    } else {
        console.log('No products found.');
    }
}

listAllProducts();
