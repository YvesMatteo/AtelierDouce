
import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function createWebhook() {
    console.log('🔗 Creating Live Webhook...');

    try {
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: 'https://www.atelierdouce.shop/api/webhook',
            enabled_events: ['checkout.session.completed'],
        });

        console.log('\n✅ Webhook created successfully!');
        console.log(`ID: ${webhookEndpoint.id}`);
        console.log(`Secret: ${webhookEndpoint.secret}`);
        console.log('\n⚠️  COPY THIS SECRET and add it to Vercel as STRIPE_WEBHOOK_SECRET');

    } catch (error: any) {
        console.error('❌ Error creating webhook:', error.message);
    }
}

createWebhook();
