import 'dotenv/config';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY is missing in .env');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
});

async function main() {
    console.log('Updating Stripe Discount: COMMUNITY5 to $5 OFF...');

    try {
        // 1. Delete existing Promotion Code if it exists
        const promoCodes = await stripe.promotionCodes.list({
            code: 'COMMUNITY5',
            limit: 1
        });

        if (promoCodes.data.length > 0) {
            console.log('Removing old promotion code:', promoCodes.data[0].id);
            // Promotion codes are usually de-activated rather than deleted if they have been used,
            // but for a clean setup we can try to set active: false or just ignore and create a new coupon id.
            // Actually, we can just delete the coupon which should invalidate related objects or we create a new coupon and link it.
            // STripe doesn't allow deleting coupons that are in use, but this is a new setup.
        }

        // 2. Delete existing Coupon if it exists
        try {
            await stripe.coupons.del('COMMUNITY5');
            console.log('✅ Deleted old coupon COMMUNITY5');
        } catch (err: any) {
            console.log('ℹ️ Old coupon not found or could not be deleted:', err.message);
        }

        // 3. Create new Coupon with $5 off
        const coupon = await stripe.coupons.create({
            id: 'COMMUNITY5',
            name: 'Community Welcome Gift ($5 OFF)',
            amount_off: 500, // $5.00
            currency: 'usd',
            duration: 'forever',
        });
        console.log('✅ Created new $5 coupon:', coupon.id);

        // 4. Create Promotion Code
        const promo = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: 'COMMUNITY5',
        });
        console.log(`✅ Success! Created new Promotion Code: ${promo.code}`);

    } catch (error: any) {
        console.error('❌ Error updating Stripe setup:', error.message);
        if (error.raw) {
            console.error('Raw Error:', JSON.stringify(error.raw, null, 2));
        }
    }
}

main();
