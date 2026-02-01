import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL, addSubscriber } from '@/lib/resend';
import { renderEmailLayout } from '@/lib/email-templates';

// Initialize inside handler to avoid build-time errors

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // Initialize Supabase Client (Service Role)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify token
        const { data, error } = await supabase
            .from('subscribers')
            .update({ verified: true, verification_token: null }) // Consume token (optional, but good practice to clear or rotate)
            // Actually, keep token null so it can't be reused, or generate new one. user is verified.
            .eq('verification_token', token)
            .select()
            .single();

        if (error || !data) {
            return NextResponse.redirect(new URL('/?verified=error', request.url));
        }

        // Sync to Resend Audience
        // We do this asynchronously (fire and forget) to not block the user response, 
        // but in Next.js Serverless this might be cut off. 
        // Ideally use waitUntil() if on Vercel Edge, or just await it to be safe.
        // Since it's critical for the "newsletter whenever we want" goal, we await it.
        await addSubscriber(data.email);

        // Send Discount Email
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.email,
            subject: 'Your Welcome Gift: $5 OFF',
            html: renderEmailLayout({
                title: "You're In!",
                previewText: "Welcome to the Atelier Douce community. Here's your $5 gift.",
                content: `
                            <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #171717; margin-bottom: 8px;">You're In! ✨</h2>
                            <div class="accent-line"></div>
                            <p style="color: #5e5e5e; margin-bottom: 24px;">
                                Thank you for joining the Atelier Douce community.<br>
                                As promised, here is your exclusive discount code for your next purchase.
                            </p>
                            
                             <div style="background-color: #faf2e6; padding: 30px; text-align: center; margin: 30px 0; border: 1px dashed #a48354;">
                                <span style="font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #a48354; font-weight: 600;">Use Code at Checkout:</span><br>
                                <strong style="font-size: 32px; color: #171717; letter-spacing: 4px; display: block; margin: 10px 0;">COMMUNITY5</strong>
                                <p style="font-size: 13px; color: #5e5e5e; margin: 0;">($5 OFF your total order)</p>
                            </div>

                            <div style="margin-top: 30px;">
                                <a href="https://www.atelierdouce.shop" class="btn">
                                    Shop the Collection
                                </a>
                            </div>
                        `
            })
        });

        // Redirect to success page
        return NextResponse.redirect(new URL('/verified', request.url));

    } catch (err) {
        console.error('Verify API Error:', err);
        return NextResponse.redirect(new URL('/?verified=error', request.url));
    }
}
