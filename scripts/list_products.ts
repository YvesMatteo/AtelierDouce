
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

    products?.forEach(p => {
        console.log(`${p.id} | ${p.name} | https://www.atelierdouce.shop/product/${p.id}`);
    });
}
main();
