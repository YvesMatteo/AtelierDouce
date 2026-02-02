import nodemailer from 'nodemailer';
import { PRODUCT_URL_MAP } from './product-url-map';

interface EmailOrderItem {
    name: string;
    quantity: number;
    options: Record<string, string>;
    cj_product_id?: string;
    supplier?: string;
}

interface EmailOrder {
    id: string;
    customer_name?: string;
    customer_email: string;
    shipping_address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}

export async function sendOrderEmail(order: EmailOrder, items: EmailOrderItem[]) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️ Gmail credentials not found. Skipping email notification.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    // Format Items List
    const itemsHtml = items.map(item => {
        // Resolve direct supplier link
        let productLink = '#';
        let supplierName = item.supplier || 'Unknown';

        // Try to find in map first using CJ ID
        if (item.cj_product_id && PRODUCT_URL_MAP[item.cj_product_id]) {
            const mapEntry = PRODUCT_URL_MAP[item.cj_product_id];
            // Prefer QkSource if available, else CJ
            if (mapEntry.qk) {
                productLink = mapEntry.qk;
                supplierName = 'QkSource';
            } else if (mapEntry.cj) {
                productLink = mapEntry.cj;
                supplierName = 'CJ Dropshipping';
            }
        }

        const optionsString = item.options
            ? Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(', ')
            : 'No options';

        return `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.name}</strong> (Qty: ${item.quantity})</p>
                <p style="color: #666; font-size: 14px;">${optionsString}</p>
                <p><a href="${productLink}" style="background-color: #0070f3; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Buy on ${supplierName}</a></p>
                <p style="font-size: 12px; color: #999;">Supplier ID: ${item.cj_product_id || 'N/A'}</p>
            </div>
        `;
    }).join('');

    // Format Address
    const addr = order.shipping_address || {};
    const addressHtml = `
        <p>
            ${order.customer_name || 'Customer'}<br>
            ${addr.line1 || ''}<br>
            ${addr.line2 ? addr.line2 + '<br>' : ''}
            ${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}<br>
            ${addr.country || ''}
        </p>
    `;

    const mailOptions = {
        from: process.env.GMAIL_USER, // "europejerseyy@gmail.com"
        to: process.env.GMAIL_USER,   // Send to self
        subject: `🔔 New Order to Fulfill: ${order.id}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>New Order Received</h1>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
                
                <hr>
                
                <h2>📦 Items to Order</h2>
                ${itemsHtml}
                
                <hr>
                
                <h2>🚚 Shipping Address</h2>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                    ${addressHtml}
                </div>
                
                <hr>
                
                <p style="font-size: 12px; color: #888;">
                    This is an automated notification for manual fulfillment.
                    Please order these items from the supplier immediately.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Order notification sent:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}
