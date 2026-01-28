
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getCJClient } from '../lib/cjdropshipping';
import { cleanProductDescription, cleanProductName, removeChinese } from './utils';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const CJ_ID = '2501070601131628700'; // Winter Coat Warm Lapel Long Fluffy
const TARGET_IMAGE = 'https://atelierdouce.shop/product-images/brown-fur-jacket-white.png';

async function main() {
    console.log(`🔧 Force updating Brown Puffer (${CJ_ID})...`);

    const cj = getCJClient();
    const details = await cj.getProductDetails(CJ_ID);
    if (!details) {
        console.error('CJ Product not found');
        return;
    }

    // Manual Override Logic
    const finalImages = [TARGET_IMAGE];

    const productData = {
        cjProductId: details.pid,
        name: cleanProductName(details.productName),
        description: cleanProductDescription(details.description) || 'Premium Winter Coat.',
        price: 95.95, // Approximate price, or fetch existing
        images: finalImages,
        cjSku: details.productSku,
    };

    console.log(`   📸 Enforcing image: ${finalImages[0]}`);

    // Update Supabase
    const { error } = await supabase
        .from('products')
        .update({
            images: finalImages,
            updated_at: new Date().toISOString(),
        })
        .eq('cj_product_id', CJ_ID);

    if (error) console.error('Supabase update failed:', error);
    else console.log('✅ Supabase updated');

    // Update Stripe
    const { data: product } = await supabase.from('products').select('stripe_product_id').eq('cj_product_id', CJ_ID).single();
    if (product?.stripe_product_id) {
        try {
            await stripe.products.update(product.stripe_product_id, {
                images: finalImages
            });
            console.log('✅ Stripe updated');
        } catch (e: any) {
            console.error('Stripe update failed:', e.message);
        }
    }
}

main().catch(console.error);
