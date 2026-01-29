
import { supabase } from '@/lib/supabase';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';

export async function processOrderAutomation(orderId: string): Promise<{ success: boolean; results?: Record<string, string>; error?: string }> {
    console.log(`🤖 Starting Order Automation for order: ${orderId}`);

    try {
        // MANUAL FULFILLMENT MODE
        console.log('   🛑 Automatic fulfillment is disabled. Please fulfill this order manually.');
        return { success: true, results: { status: 'manual_fulfillment_required' } };

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
