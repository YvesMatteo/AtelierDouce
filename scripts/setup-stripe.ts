import 'dotenv/config';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY is missing in .env');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    console.log('Creating Stripe Coupon: COMMUNITY5...');

    try {
        // Create the coupon (The logic for the discount)
        // We set the ID to COMMUNITY5 so it's easy to track, but "promotion codes" are what users type.
        // However, for simple setups, Stripe Checkout can accept Coupon IDs directly if "Allow Promotion Codes" is enabled 
        // OR we create a Promotion Code that points to this coupon.
        // Let's create the coupon with id='COMMUNITY5' first.

        // Check if it exists first
        try {
            const existing = await stripe.coupons.retrieve('COMMUNITY5');
            console.log('✅ Coupon COMMUNITY5 already exists.');
            return;
        } catch (err: any) {
            // If error is not "resource_missing", rethrow
            if (err.code !== 'resource_missing') throw err;
        }

        const coupon = await stripe.coupons.create({
            id: 'COMMUNITY5', // Force the ID
            name: 'Community Welcome Gift',
            percent_off: 5,
            duration: 'forever',
        });

        console.log(`✅ Coupon created: ${coupon.name} (${coupon.id})`);

        // Also create a Promotion Code "COMMUNITY5" that links to this coupon, 
        // just in case they use the new Checkout Builder which prefers Promotion Codes.
        // The code the user types is "code".
        const promo = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: 'COMMUNITY5',
        });

        console.log(`✅ Promotion Code created: ${promo.code}`);

    } catch (error: any) {
        console.error('❌ Error creating coupon:', error.message);
    }
}

main();
