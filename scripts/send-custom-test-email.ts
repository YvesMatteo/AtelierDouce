import 'dotenv/config';
import { resend } from '../lib/resend';

async function sendSpecificTestEmail() {
    const fromEmail = 'support@atelierdouce.shop';
    const toEmail = 'yves.matro@gmail.com';

    console.log(`📧 Attempting to send email from ${fromEmail} to ${toEmail}...`);

    try {
        const { data, error } = await resend.emails.send({
            from: `Atelier Douce <${fromEmail}>`,
            to: toEmail,
            subject: 'Test Email from Atelier Douce Support',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h1>It works! 🎉</h1>
                    <p>This is a test email sent via Resend from your custom domain.</p>
                    <p>If you are seeing this, your domain verification and API key are correctly configured.</p>
                </div>
            `,
        });

        if (error) {
            console.error('❌ Resend Error:', error);
            console.log('💡 Note: If you get a "validation_error" about the domain, ensure you have verified "atelierdouce.shop" in the Resend dashboard.');
        } else {
            console.log(`✅ Email sent successfully! ID: ${data?.id}`);
        }
    } catch (err: any) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

sendSpecificTestEmail();
