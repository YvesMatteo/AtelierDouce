
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_ID = '996BA858-DC7C-4405-9A62-9BF17218E6BE';

async function verifyLeggings() {
    console.log('🔍 Verifying Brushed Fleece Leggings images...');

    const { data: product, error } = await supabase
        .from('products')
        .select('name, images')
        .eq('cj_product_id', PRODUCT_ID)
        .single();

    if (error || !product) {
        console.error('Error fetching product:', error);
        return;
    }

    if (!product.images || product.images.length === 0) {
        console.error('❌ No images found!');
        return;
    }

    console.log(`Found ${product.images.length} images.`);

    for (const img of product.images) {
        if (img.includes('atelierdouce.shop')) {
            console.log(`❌ Still has local image: ${img}`);
        } else {
            console.log(`✅ Valid external image: ${img}`);
        }
    }
}

verifyLeggings();
