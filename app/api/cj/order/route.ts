import { NextResponse } from 'next/server';
import { getCJClient, CJOrderRequest } from '@/lib/cjdropshipping';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get order from Supabase
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
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Prepare CJ order request
        const shippingAddress = order.shipping_address as any;

        const cjOrder: CJOrderRequest = {
            orderNumber: order.id,
            shippingZip: shippingAddress?.postal_code || '',
            shippingCountry: shippingAddress?.country || 'US',
            shippingCountryCode: shippingAddress?.country || 'US',
            shippingProvince: shippingAddress?.state || '',
            shippingCity: shippingAddress?.city || '',
            shippingAddress: shippingAddress?.line1 || '',
            shippingCustomerName: order.customer_name || '',
            shippingPhone: shippingAddress?.phone || '',
            products: order.order_items.map((item: any) => ({
                vid: item.cj_variant_id || item.products?.cj_product_id,
                quantity: item.quantity,
            })),
            payType: 1, // Balance payment
            remark: `Stripe Order: ${order.stripe_session_id}`,
        };

        // Create order in CJDropshipping
        const cj = getCJClient();
        const cjResult = await cj.createOrder(cjOrder);

        // Update order with CJ order ID
        await supabase
            .from('orders')
            .update({
                cj_order_id: cjResult.orderId,
                status: 'processing',
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        return NextResponse.json({
            success: true,
            cjOrderId: cjResult.orderId,
            cjOrderNum: cjResult.orderNum,
        });
    } catch (error: any) {
        console.error('CJ Order API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create CJ order' },
            { status: 500 }
        );
    }
}
