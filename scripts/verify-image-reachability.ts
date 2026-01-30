
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyReachability() {
    console.log('🌐 Verifying image reachability (ALL images)...');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images, cj_product_id');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    let badImages = 0;

    async function checkUrl(url: string): Promise<boolean> {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            return false;
        }
    }

    const CONCURRENCY = 10;

    for (const p of products) {
        if (Array.isArray(p.images) && p.images.length > 0) {
            // console.log(`Checking ${p.name} (${p.images.length} images)...`);

            let hasBad = false;
            for (let i = 0; i < p.images.length; i++) {
                const img = p.images[i];
                if (typeof img === 'string' && img.startsWith('http')) {
                    const ok = await checkUrl(img);
                    if (!ok) {
                        console.log(`❌ [Broken] ${p.name} (${p.cj_product_id}) [Index ${i}] -> ${img}`);
                        hasBad = true;
                    }
                }
            }

            if (hasBad) badImages++;
        }
    }

    console.log(`\nFound ${badImages} products with at least one broken image out of ${products.length} products.`);
}

verifyReachability();
