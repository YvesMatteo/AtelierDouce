import 'dotenv/config';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY is missing in .env');
    process.exit(1);
}

// Explicitly use a recent API version to ensure promotion codes are supported correctly
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
});

async function main() {
    console.log('Fixing Stripe Promotion Code: COMMUNITY5...');

    try {
        // 1. Ensure Coupon exists
        let coupon;
        try {
            coupon = await stripe.coupons.retrieve('COMMUNITY5');
            console.log('✅ Found existing coupon:', coupon.id);
        } catch (err: any) {
            console.log('ℹ️ Coupon not found, creating it...');
            coupon = await stripe.coupons.create({
                id: 'COMMUNITY5',
                name: 'Community Welcome Gift',
                percent_off: 5,
                duration: 'forever',
            });
            console.log('✅ Created coupon:', coupon.id);
        }

        // 2. Check for existing Promotion Code
        const promoCodes = await stripe.promotionCodes.list({
            coupon: coupon.id,
            code: 'COMMUNITY5',
            limit: 1
        });

        if (promoCodes.data.length > 0) {
            console.log('✅ Promotion code already exists:', promoCodes.data[0].code);
            return;
        }

        // 3. Create Promotion Code
        console.log('Creating promotion code...');
        const promo = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: 'COMMUNITY5',
        });

        console.log(`✅ Success! Created Promotion Code: ${promo.code}`);

    } catch (error: any) {
        console.error('❌ Error fixing Stripe setup:', error.message);
        // Log detailed error if available
        if (error.raw) {
            console.error('Raw Error:', JSON.stringify(error.raw, null, 2));
        }
    }
}

main();
