
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', '9dae65a1-e8c2-454d-b9a7-6032bf7936ee');

    if (error) console.error(error);
    else console.log(JSON.stringify(products, null, 2));
}

main();
