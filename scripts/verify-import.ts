
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, price, options, images')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error(error);
        return;
    }

    products.forEach(p => {
        console.log(`\nProduct: ${p.name}`);
        console.log(`Price: $${p.price}`);
        console.log('Options:', JSON.stringify(p.options, null, 2));
    });
}

verify();
