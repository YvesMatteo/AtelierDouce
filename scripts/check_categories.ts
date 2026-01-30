
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data } = await supabase.from('products').select('category');
    if (!data) return;

    const categories = new Set(data.map(p => p.category));
    console.log('Existing Categories:', [...categories]);
}

main();
