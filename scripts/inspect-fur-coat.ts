import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_ID = '0045f0b5-cb0b-448b-80b8-fb679f042709';

async function inspect() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, images')
        .eq('id', PRODUCT_ID)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
    } else {
        console.log('Product Found:', data.name);
        console.log('Images:', data.images);
    }
}

inspect();
