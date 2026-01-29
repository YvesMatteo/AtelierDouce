
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImages() {
    const productName = "Winter Coat Warm Lapel Long Fluffy Faux Fur Coat";
    console.log(`🔍 Verifying images for: "${productName}"...`);

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images')
        .ilike('name', productName);

    if (error || !products || products.length === 0) {
        console.error('❌ Could not find product to verify.');
        return;
    }

    const product = products[0];
    console.log('📸 Current first 3 images:');
    product.images.slice(0, 3).forEach((img: string, i: number) => {
        console.log(`[${i}] ${img}`);
    });
}

verifyImages();
