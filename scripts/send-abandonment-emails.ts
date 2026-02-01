import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL } from '../lib/resend';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendAbandonmentEmails() {
    console.log('🚀 Checking for abandoned checkouts...');

    // Find "abandoned" records created > 1 hour ago that haven't received an email yet
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: abandoned, error } = await supabase
        .from('abandoned_checkouts')
        .select('*')
        .eq('status', 'abandoned')
        .eq('email_sent', false)
        .lt('created_at', oneHourAgo);

    if (error) {
        console.error('❌ Error fetching abandoned checkouts:', error);
        return;
    }

    console.log(`📦 Found ${abandoned.length} abandoned checkouts to process.`);

    for (const record of abandoned) {
        console.log(`📧 Sending recovery email to ${record.email}...`);

        try {
            const cartItems = record.cart_items || [];
            const itemsHtml = cartItems.map((item: any) => `
                <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 100px; height: auto; border-radius: 4px;" />
                    <div style="display: inline-block; vertical-align: top; margin-left: 15px;">
                        <h3 style="margin: 0; font-size: 16px;">${item.name}</h3>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">Qty: ${item.quantity}</p>
                        <p style="margin: 5px 0; font-weight: bold;">$${item.price}</p>
                    </div>
                </div>
            `).join('');

            const { data, error: sendError } = await resend.emails.send({
                from: FROM_EMAIL,
                to: record.email,
                subject: 'You left something behind at Atelier Douce!',
                html: `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h1 style="color: #171717; text-align: center;">Wait, you forgot something? 🧥</h1>
                        <p style="font-size: 16px; line-height: 1.6; text-align: center;">
                            We noticed you left some beautiful pieces in your cart. 
                            Your style is impeccable, and we'd love to help you finish your look.
                        </p>
                        
                        <div style="margin: 30px 0;">
                            ${itemsHtml}
                        </div>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="https://www.atelierdouce.shop" style="background-color: #232323; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                Get My Items Now
                            </a>
                        </div>
                        
                        <hr style="margin-top: 50px; border: none; border-top: 1px solid #eee;" />
                        
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            If you have any questions, simply reply to this email. We're here to help!<br>
                            &copy; 2026 Atelier Douce | Premium Comfort
                        </p>
                    </div>
                `,
            });

            if (sendError) {
                console.error(`- ❌ Error sending to ${record.email}:`, sendError);
            } else {
                console.log(`- ✅ Email sent successfully! ID: ${data?.id}`);

                // Update record to prevent duplicate emails
                await supabase
                    .from('abandoned_checkouts')
                    .update({ email_sent: true, updated_at: new Date().toISOString() })
                    .eq('id', record.id);
            }

        } catch (err: any) {
            console.error(`- ❌ Unexpected error for ${record.email}:`, err.message);
        }
    }

    console.log('\n✨ Automation complete!');
}

sendAbandonmentEmails().catch(console.error);
