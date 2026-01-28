
import { supabase } from '@/lib/supabase';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';

export async function processOrderAutomation(orderId: string): Promise<{ success: boolean; results?: Record<string, string>; error?: string }> {
    console.log(`🤖 Starting Order Automation for order: ${orderId}`);

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

        // 2. Group items by supplier
        const itemsBySupplier: Record<string, any[]> = {};

        for (const item of order.order_items) {
            // Default to CJ if supplier is missing (legacy compatibility)
            const supplier = item.supplier || item.products?.supplier || 'CJ';

            if (!itemsBySupplier[supplier]) {
                itemsBySupplier[supplier] = [];
            }
            itemsBySupplier[supplier].push(item);
        }

        console.log('   📦 Items grouped by supplier:', Object.keys(itemsBySupplier));

        const results: Record<string, string> = {};

        // 3. Route to specific fulfillment handlers
        if (itemsBySupplier['CJ'] && itemsBySupplier['CJ'].length > 0) {
            if (order.cj_order_id) {
                console.log('   ⚠️ CJ Order already processed:', order.cj_order_id);
                results['CJ'] = order.cj_order_id;
            } else {
                console.log(`   ➡️ Routing ${itemsBySupplier['CJ'].length} items to CJ Dropshipping...`);
                try {
                    const cjId = await fulfillWithCJ(order, itemsBySupplier['CJ']);
                    results['CJ'] = cjId;

                    // Update main order with CJ ID (Legacy support)
                    // Ideally we should have a `supplier_orders` table, but for now we keep cj_order_id on orders
                    await supabase.from('orders').update({
                        cj_order_id: cjId,
                        status: 'processing',
                        updated_at: new Date().toISOString()
                    }).eq('id', orderId);

                } catch (e: any) {
                    console.error('   ❌ CJ Fulfillment Failed:', e.message);
                    results['CJ_ERROR'] = e.message;
                }
            }
        }

        if (itemsBySupplier['Qksource'] && itemsBySupplier['Qksource'].length > 0) {
            console.log(`   ➡️ Routing ${itemsBySupplier['Qksource'].length} items to Qksource...`);
            try {
                const qkId = await fulfillWithQksource(order, itemsBySupplier['Qksource']);
                results['Qksource'] = qkId;
            } catch (e: any) {
                console.error('   ❌ Qksource Fulfillment Failed:', e.message);
                results['Qksource_ERROR'] = e.message;
            }
        }

        return { success: true, results };

    } catch (error: any) {
        console.error('   ❌ Automation Failed:', error.message);
        return { success: false, error: error.message };
    }
}

async function fulfillWithCJ(order: any, items: any[]): Promise<string> {
    const shippingAddress = order.shipping_address as any;

    // Map products
    const products = items.map((item: any) => {
        const vid = item.cj_variant_id || item.products?.cj_product_id;
        if (!vid) {
            console.warn(`       ⚠️ Missing CJ Variant ID for item: ${item.id}`);
        }
        return {
            vid: vid,
            quantity: item.quantity,
        };
    }).filter((p: any) => p.vid);

    if (products.length === 0) {
        throw new Error('No valid CJ products found');
    }

    // Resolve Country Name
    const countryCode = shippingAddress?.country || 'US';
    let countryName = countryCode;
    try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        countryName = regionNames.of(countryCode) || countryCode;
    } catch (e) {
        console.warn(`Could not resolving country name for ${countryCode}`);
    }

    const cjOrder: CJOrderRequest = {
        orderNumber: order.id,
        shippingZip: shippingAddress?.postal_code || '00000',
        shippingCountry: countryName,
        shippingCountryCode: countryCode,
        shippingProvince: shippingAddress?.state || '',
        shippingCity: shippingAddress?.city || '',
        shippingAddress: [shippingAddress?.line1, shippingAddress?.line2].filter(Boolean).join(', '),
        shippingCustomerName: order.customer_name || 'Customer',
        shippingPhone: shippingAddress?.phone || '0000000000',
        products: products,
        payType: 1,
        remark: `Stripe Ref: ${order.stripe_session_id}`,
    };

    const cj = getCJClient();
    const cjResult = await cj.createOrder(cjOrder);

    console.log('       ✅ CJ Order Created:', cjResult.orderId);
    return cjResult.orderId;
}

// Placeholder for future Qksource integration
async function fulfillWithQksource(order: any, items: any[]): Promise<string> {
    console.log('       🚧 Qksource API not yet integrated. Simulating success.');

    // Future: 
    // 1. Authenticate with Qksource API
    // 2. Map items to Qksource SKUs
    // 3. Create Order

    return `QK-SIM-${Date.now()}`;
}
