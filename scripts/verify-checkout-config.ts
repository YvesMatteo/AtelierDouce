import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function verifyCheckoutConfig() {
    console.log('🧪 Verifying Checkout Session Config...');

    try {
        // Create a dummy session to check if the config is accepted by Stripe API
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Test Product',
                    },
                    unit_amount: 2000,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'],
            },
        });

        console.log('✅ Session created successfully!');
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Payment Method Options:`, JSON.stringify(session.payment_method_options, null, 2));

        if (session.payment_method_options) {
            console.log('   ℹ️ Session created with options (validated).');
        }

    } catch (error: any) {
        console.error('❌ Error creating session:', error.message);
    }
}

verifyCheckoutConfig();
