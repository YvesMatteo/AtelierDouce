import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { renderEmailLayout } from '@/lib/email-templates';

// Initialize Supabase admin client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Prevent Vercel from caching this response
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Basic auth check using a query param secret if wanted, 
    // but for now we'll rely on obscurity or Vercel Cron protection.
    // Ideally verify 'Authorization' header if triggered by Vercel Cron.

    console.log('🚀 [CRON] Checking for abandoned checkouts...');

    try {
        // Find "abandoned" records created > 1 hour ago that haven't received an email yet
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: abandoned, error } = await supabase
            .from('abandoned_checkouts')
            .select('*')
            .eq('status', 'abandoned')
            .eq('email_sent', false)
            .lt('created_at', oneHourAgo)
            .limit(50); // Process in batches

        if (error) {
            console.error('❌ Error fetching abandoned checkouts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`📦 Found ${abandoned.length} abandoned checkouts to process.`);

        const results = [];

        for (const record of abandoned) {
            console.log(`📧 Sending recovery email to ${record.email}...`);

            const cartItems = record.cart_items || [];
            if (cartItems.length === 0) continue;

            const itemsHtml = cartItems.map((item: any) => `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${item.image}" alt="${item.name}" style="width: 100px; height: auto; border: 1px solid #f0f0f0;" />
                    </div>
                    <div class="product-details">
                        <h3 class="product-name">${item.name}</h3>
                        <p class="product-meta">Quantity: ${item.quantity}</p>
                        <p class="product-price">$${item.price}</p>
                    </div>
                </div>
            `).join('');

            // Recovery Link
            const recoveryLink = `https://www.atelierdouce.shop/?checkout_recovery=${record.id}`;

            try {
                const { data: emailData, error: sendError } = await resend.emails.send({
                    from: FROM_EMAIL,
                    to: record.email,
                    subject: 'You left something behind at Atelier Douce!',
                    html: renderEmailLayout({
                        title: 'Almost Yours',
                        previewText: 'We noticed you left some beautiful pieces in your cart.',
                        content: `
                            <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #171717; margin-bottom: 8px;">Wait, you forgot something?</h2>
                            <div class="accent-line"></div>
                            <p style="color: #5e5e5e; margin-bottom: 32px;">
                                We noticed you left some beautiful pieces in your cart. 
                                Your style is impeccable, and we'd love to help you finish your look.
                            </p>
                            
                            <div style="margin: 30px 0;">
                                ${itemsHtml}
                            </div>
                            
                            <div style="margin-top: 40px;">
                                <a href="${recoveryLink}" class="btn">
                                    Return to Checkout
                                </a>
                            </div>
                        `
                    }),
                });

                if (sendError) {
                    console.error(`- ❌ Error sending to ${record.email}:`, sendError);
                    results.push({ email: record.email, status: 'failed', error: sendError.message });
                } else {
                    console.log(`- ✅ Email sent successfully! ID: ${emailData?.id}`);

                    // Update record
                    await supabase
                        .from('abandoned_checkouts')
                        .update({ email_sent: true, updated_at: new Date().toISOString() })
                        .eq('id', record.id);

                    results.push({ email: record.email, status: 'sent', id: emailData?.id });
                }

            } catch (err: any) {
                console.error(`- ❌ Unexpected error for ${record.email}:`, err.message);
                results.push({ email: record.email, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });
    } catch (err: any) {
        console.error('Cron job error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
