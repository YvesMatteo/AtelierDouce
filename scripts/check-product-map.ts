import { createClient } from '@supabase/supabase-js';
import { PRODUCT_URL_MAP } from '../lib/product-url-map';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProductMap() {
    console.log('🔍 Checking Product URL Map against Active Products...');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, cj_product_id, supplier')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Error fetching products:', error);
        process.exit(1);
    }

    console.log(`📦 Found ${products.length} active products.`);

    let missingCount = 0;

    for (const product of products) {
        // Skip if no CJ ID (might be custom product?)
        if (!product.cj_product_id) {
            console.log(`⚠️ Product "${product.name}" (ID: ${product.id}) has no CJ Product ID.`);
            continue;
        }

        if (!PRODUCT_URL_MAP[product.cj_product_id]) {
            console.log(`❌ MISSING IN MAP: "${product.name}"`);
            console.log(`   CJ ID: ${product.cj_product_id}`);
            missingCount++;
        }
    }

    if (missingCount === 0) {
        console.log('✅ All active products are mapped!');
    } else {
        console.log(`--------------------------------------------------`);
        console.log(`❌ ${missingCount} products are missing from PRODUCT_URL_MAP.`);
        console.log(`   You need to update lib/product-url-map.ts`);
    }
}

checkProductMap();
