import 'dotenv/config';
import { resend, FROM_EMAIL } from '../lib/resend';

async function testResend() {
    console.log('🧪 Testing Resend connection...');
    console.log('From:', FROM_EMAIL);

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: 'delivered@resend.dev', // Resend test recipient
            subject: 'Test Email from Atelier Douce',
            html: '<p>Resend is working correctly!</p>',
        });

        if (error) {
            console.error('❌ Resend Error:', error);
        } else {
            console.log('✅ Resend Success! Message ID:', data?.id);
        }
    } catch (err: any) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testResend();
