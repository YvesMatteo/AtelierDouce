import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function listProducts() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for inspection
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, gender, created_at')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products?.length} active products:`);
    console.table(products);
}

listProducts().catch(console.error);
