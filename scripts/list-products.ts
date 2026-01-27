import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stripe_product_id, is_active');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('Found products:', products.length);
    products.forEach(p => {
        const status = p.is_active ? '✅ Active' : '❌ Inactive';
        console.log(`- [${p.id}] ${p.name} (${status})`);
    });
}

listProducts();
