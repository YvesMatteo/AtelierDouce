import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listImages(name: string) {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name);

    if (error || !products?.length) {
        console.error('Product not found or error:', error);
        return;
    }

    const product = products[0];
    console.log(`Product: ${product.name} (ID: ${product.id})`);
    console.log('Images:');
    product.images.forEach((url: string, index: number) => {
        console.log(`[${index}] ${url}`);
    });
}

listImages("Timeless Camel Wool Coat");
