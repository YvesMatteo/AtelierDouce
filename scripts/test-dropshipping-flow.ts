
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// We need to use dynamic imports or require for the lib files if we want to rely on tsx alias resolution,
// but let's try importing them directly. 
// Note: We are using relative paths here, but the imported files use aliases.
// We will rely on tsconfig-paths/register when running.

import { processOrderToCJ } from '../lib/automation';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDropshipping() {
    console.log('🚀 Starting Dropshipping Test Flow');

    // 1. Create a Fake Order
    const fakeSessionId = `test_session_${Date.now()}`;

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            stripe_session_id: fakeSessionId,
            stripe_payment_intent: `pi_test_${Date.now()}`,
            customer_email: 'test@example.com',
            customer_name: 'Test Automatic User',
            shipping_address: {
                line1: '123 Test St',
                city: 'Test City',
                state: 'NY',
                postal_code: '10001',
                country: 'US',
                phone: '5551234567'
            },
            status: 'paid', // vital for logic? Automation usually runs on webhook so status is 'paid'
            amount_total: 0,
            currency: 'usd'
        })
        .select()
        .single();

    if (orderError) {
        console.error('❌ Failed to create test order:', orderError);
        return;
    }

    console.log(`✅ Created test order: ${order.id}`);

    // 2. Add Order Items (Free Gift - Silver)
    // Silver Variant ID: 1381486070348255232
    const silverVariantId = '1381486070348255232';

    const { error: itemError } = await supabase
        .from('order_items')
        .insert({
            order_id: order.id,
            product_id: null, // Simulated gift
            quantity: 1,
            price: 0,
            options: { is_gift: true, Color: 'Silver' },
            cj_variant_id: silverVariantId
        });

    if (itemError) {
        console.error('❌ Failed to create test order item:', itemError);
        return;
    }
    console.log('✅ Added Silver Earrings to order items');

    // 3. Run Automation
    console.log('🤖 Triggering CJ Automation...');
    const result = await processOrderToCJ(order.id);

    if (result.success) {
        console.log('🎉 SUCCESS! Dropshipping Pipeline Works.');
        console.log('CJ Order ID:', result.cjOrderId);

        // Cleanup (optional, maybe keep it to show user)
        // await supabase.from('orders').delete().eq('id', order.id);
    } else {
        console.error('💥 FAILED. Automation returned error:', result.error);
    }
}

testDropshipping();
