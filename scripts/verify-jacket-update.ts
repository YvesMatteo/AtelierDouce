
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUpdate() {
    const productId = '52193140-47b1-4b2a-9355-84178aa0f4d6';

    console.log('🔍 Verifying product images...');
    const { data: product, error } = await supabase
        .from('products')
        .select('name, images')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('❌ Error fetching product:', error);
        return;
    }

    if (!product) {
        console.error('❌ Product not found');
        return;
    }

    console.log(`✅ Product Found: ${product.name}`);
    console.log('📸 Main Image URL:', product.images?.[0]);

    if (product.images?.[0]?.includes('3d-jacket-main-')) {
        console.log('✅ VERIFICATION SUCCESS: Main image appears to be the newly uploaded one.');
    } else {
        console.error('❌ VERIFICATION FAILED: Main image does not match expected filename pattern.');
    }
}

verifyUpdate();
