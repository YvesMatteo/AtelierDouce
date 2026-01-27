
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getGift() {
    const id = '1746094682741936128'; // Niche Plaid Cloud Bag (CJ ID)
    // Or we should check if this is the database UUID or CJ ID. 
    // In apply-selected-images.ts, it was used as 'cj_product_id'.
    // Let's query by cj_product_id first.

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', id)
        .single();

    if (data) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        // Try UUID just in case
        const { data: data2 } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        console.log(JSON.stringify(data2, null, 2));
    }
}

getGift();
