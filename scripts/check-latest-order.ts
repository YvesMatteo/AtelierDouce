
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLatestOrder() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('No orders found.');
        return;
    }

    const order = orders[0];
    console.log('Latest Order:', {
        id: order.id,
        created_at: order.created_at,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        cj_order_id: order.cj_order_id,
        status: order.status
    });

    if (order.cj_order_id) {
        console.log(`✅ SUCCESS: Order successfully sent to CJ! CJ Order ID: ${order.cj_order_id}`);
    } else {
        console.log('❌ FAILURE: CJ Order ID is missing. The automation might have failed.');
    }
}

checkLatestOrder();
