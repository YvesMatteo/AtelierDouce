import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🔍 Verifying Stripe Configuration...\n');

    // 1. Fetch all products from database
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, stripe_product_id, stripe_price_id')
        .order('name');

    if (error) {
        console.error('❌ Failed to fetch products:', error);
        return;
    }

    console.log(`📦 Found ${products?.length} products in database\n`);

    let validCount = 0;
    let issueCount = 0;
    const issues: string[] = [];

    for (const product of products || []) {
        const productIssues: string[] = [];

        // Check Stripe product
        if (!product.stripe_product_id) {
            productIssues.push('Missing stripe_product_id');
        } else {
            try {
                const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
                if (!stripeProduct.active) {
                    productIssues.push('Stripe product is inactive');
                }
                if (stripeProduct.name !== product.name) {
                    productIssues.push(`Stripe name mismatch: "${stripeProduct.name}" vs "${product.name}"`);
                }
            } catch (err: any) {
                productIssues.push(`Stripe product error: ${err.message}`);
            }
        }

        // Check Stripe price
        if (!product.stripe_price_id) {
            productIssues.push('Missing stripe_price_id');
        } else {
            try {
                const stripePrice = await stripe.prices.retrieve(product.stripe_price_id);
                if (!stripePrice.active) {
                    productIssues.push('Stripe price is inactive');
                }
                const expectedCents = Math.round(product.price * 100);
                if (stripePrice.unit_amount !== expectedCents) {
                    productIssues.push(`Price mismatch: Stripe €${(stripePrice.unit_amount || 0) / 100} vs DB €${product.price}`);
                }
            } catch (err: any) {
                productIssues.push(`Stripe price error: ${err.message}`);
            }
        }

        if (productIssues.length === 0) {
            console.log(`✅ ${product.name} (€${product.price})`);
            validCount++;
        } else {
            console.log(`❌ ${product.name} (€${product.price})`);
            productIssues.forEach(issue => console.log(`   ⚠️ ${issue}`));
            issues.push(`${product.name}: ${productIssues.join(', ')}`);
            issueCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Valid: ${validCount} products`);
    console.log(`❌ Issues: ${issueCount} products`);

    // 2. List coupons
    console.log('\n📋 Available Coupons:');
    try {
        const coupons = await stripe.coupons.list({ limit: 10 });
        if (coupons.data.length === 0) {
            console.log('   No coupons found');
        } else {
            coupons.data.forEach(coupon => {
                const discount = coupon.percent_off
                    ? `${coupon.percent_off}% off`
                    : `€${(coupon.amount_off || 0) / 100} off`;
                console.log(`   • ${coupon.name || coupon.id}: ${discount} (${coupon.duration})`);
            });
        }
    } catch (err: any) {
        console.log(`   Error listing coupons: ${err.message}`);
    }

    // 3. List promotion codes
    console.log('\n🎫 Promotion Codes:');
    try {
        const promos = await stripe.promotionCodes.list({ limit: 10, active: true });
        if (promos.data.length === 0) {
            console.log('   No promotion codes found');
        } else {
            promos.data.forEach(promo => {
                console.log(`   • Code: "${promo.code}" → Coupon: ${promo.coupon.name || promo.coupon.id}`);
            });
        }
    } catch (err: any) {
        console.log(`   Error listing promos: ${err.message}`);
    }
}

main().catch(console.error);
