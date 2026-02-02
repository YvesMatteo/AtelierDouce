import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(products, null, 2));
}

listProducts();
