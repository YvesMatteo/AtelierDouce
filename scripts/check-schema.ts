
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    // We can't directly query schema easily with JS client without SQL editor normally, 
    // but we can insert a dummy row and see error or just fetch one row and see keys.

    const { data: products } = await supabase.from('products').select('*').limit(1);
    console.log('Product Keys:', products && products.length > 0 ? Object.keys(products[0]) : 'No products found');

    const { data: orderItems } = await supabase.from('order_items').select('*').limit(1);
    console.log('OrderItem Keys:', orderItems && orderItems.length > 0 ? Object.keys(orderItems[0]) : 'No order items found');
}

checkSchema();
