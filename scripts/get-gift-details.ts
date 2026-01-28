
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getGiftDetails() {
    const productId = 'a6d7d176-ea9e-4070-b0d1-11cc05ef283d';

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Product ID:', product.id);
    console.log('CJ Product ID:', product.cj_product_id);
    console.log('Variants:', JSON.stringify(product.variants, null, 2));
    console.log('Options:', JSON.stringify(product.options, null, 2));
}

getGiftDetails();
