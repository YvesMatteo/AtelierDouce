import 'dotenv/config';
import { sendOrderEmail } from '../lib/email';

async function testEmail() {
    console.log('🧪 Testing Email Notification...');

    const mockOrder = {
        id: 'TEST-ORDER-123',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        shipping_address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postal_code: '12345',
            country: 'Country'
        }
    };

    const mockItems = [
        {
            name: 'Test Product 1 (CJ)',
            quantity: 1,
            options: { Size: 'M', Color: 'Blue' },
            cj_product_id: '1578244934304542720', // Pearl Necklace ID from map
            supplier: 'CJ'
        },
        {
            name: 'Test Product 2 (Unknown)',
            quantity: 2,
            options: { Style: 'A' },
            supplier: 'Unknown'
        }
    ];

    await sendOrderEmail(mockOrder, mockItems);
    console.log('✅ Test function called. Check console for "Message sent" or warnings.');
}

testEmail().catch(console.error);
