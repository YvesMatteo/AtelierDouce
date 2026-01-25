
import { supabase } from '@/lib/supabase';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';

export async function processOrderToCJ(orderId: string): Promise<{ success: boolean; cjOrderId?: string; error?: string }> {
    console.log(`🤖 Starting CJ automation for order: ${orderId}`);

    try {
        // 1. Get order from Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items(
                    *,
                    products(*)
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            throw new Error(`Order not found: ${orderError?.message}`);
        }

        if (order.cj_order_id) {
            console.log('   ⚠️ Order already processed in CJ:', order.cj_order_id);
            return { success: true, cjOrderId: order.cj_order_id };
        }

        // 2. Prepare CJ order request
        const shippingAddress = order.shipping_address as any;

        // Map products
        // Handle case where product might not have a direct mapping (shouldn't happen with our sync)
        const products = order.order_items.map((item: any) => {
            const vid = item.cj_variant_id || item.products?.cj_product_id;
            if (!vid) {
                console.warn(`   ⚠️ Missing CJ Variant ID for item: ${item.id}`);
            }
            return {
                vid: vid,
                quantity: item.quantity,
            };
        }).filter((p: any) => p.vid); // Filter out invalid items

        if (products.length === 0) {
            throw new Error('No valid CJ products found in order');
        }

        const cjOrder: CJOrderRequest = {
            orderNumber: order.id,
            shippingZip: shippingAddress?.postal_code || '00000',
            shippingCountry: shippingAddress?.country || 'US',
            shippingCountryCode: shippingAddress?.country || 'US',
            shippingProvince: shippingAddress?.state || '',
            shippingCity: shippingAddress?.city || '',
            shippingAddress: [shippingAddress?.line1, shippingAddress?.line2].filter(Boolean).join(', '),
            shippingCustomerName: order.customer_name || 'Customer',
            shippingPhone: shippingAddress?.phone || '0000000000',
            products: products,
            payType: 1, // 1 = Balance (requires funds), will otherwise go to "Awaiting Payment"
            remark: `Stripe Ref: ${order.stripe_session_id}`,
        };

        // 3. Create order in CJDropshipping
        const cj = getCJClient();
        console.log('   📤 Sending to CJ Dropshipping...');
        const cjResult = await cj.createOrder(cjOrder);

        console.log('   ✅ CJ Order Created:', cjResult.orderId);

        // 4. Update order with CJ order ID
        await supabase
            .from('orders')
            .update({
                cj_order_id: cjResult.orderId,
                status: 'processing',
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        return { success: true, cjOrderId: cjResult.orderId };

    } catch (error: any) {
        console.error('   ❌ Automation Sync Failed:', error.message);
        return { success: false, error: error.message };
    }
}
