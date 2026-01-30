import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log('🔍 Scanning products for image issues...');

    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images, cj_product_id');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    let doubleStringified = 0;
    let emptyImages = 0;
    let invalidUrls = 0;
    let nullImages = 0;

    for (const p of products) {
        if (!p.images) {
            console.log(`❌ [NULL] ${p.name} (${p.cj_product_id})`);
            nullImages++;
            continue;
        }

        if (Array.isArray(p.images)) {
            if (p.images.length === 0) {
                console.log(`⚠️ [EMPTY] ${p.name} (${p.cj_product_id})`);
                emptyImages++;
            } else {
                // Check first image
                const first = p.images[0];
                if (typeof first === 'string') {
                    if (first.startsWith('[')) {
                        console.log(`🐛 [DOUBLE-JSON] ${p.name} (${p.cj_product_id})`);
                        doubleStringified++;
                    } else if (!first.startsWith('http')) {
                        console.log(`🚫 [INVALID-URL] ${p.name} (${p.cj_product_id}) -> ${first}`);
                        invalidUrls++;
                    }
                }
            }
        } else {
            console.log(`❓ [UNKNOWN-TYPE] ${p.name} (${p.cj_product_id}) -> ${typeof p.images}`);
        }
    }

    console.log('\n--- Summary ---');
    console.log(`Total Products: ${products.length}`);
    console.log(`Null Images: ${nullImages}`);
    console.log(`Empty Images: ${emptyImages}`);
    console.log(`Double-Stringified JSON: ${doubleStringified}`);
    console.log(`Invalid URLs: ${invalidUrls}`);
}

check();
