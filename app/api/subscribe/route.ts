import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { renderEmailLayout } from '@/lib/email-templates';

// Initialize inside handler to avoid build-time errors

export async function POST(request: Request) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY is missing');
            return NextResponse.json({ error: 'Server misconfiguration: Missing email key' }, { status: 500 });
        }

        // generate a simple token
        const token = crypto.randomUUID();

        // Initialize Supabase Client (Service Role)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if subscriber already exists and is verified
        const { data: existingSubscriber } = await supabase
            .from('subscribers')
            .select('email, verified')
            .eq('email', email)
            .single();

        if (existingSubscriber?.verified) {
            // Already a verified subscriber, don't send another email
            return NextResponse.json({
                success: true,
                already_subscribed: true
            });
        }

        // Upsert subscriber (new or updating unverified)
        const { error } = await supabase
            .from('subscribers')
            .upsert({
                email,
                verified: false,
                verification_token: token,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email'
            });

        if (error) {
            console.error('Subscription error:', error);
            return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
        }

        console.log(`Sending email to ${email} with token ${token}`);

        // Send Verification Email
        const verifyLink = `https://www.atelierdouce.shop/api/subscribe/verify?token=${token}`;

        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Please verify your subscription - Atelier Douce',
            html: renderEmailLayout({
                title: 'Almost There',
                previewText: 'Confirm your email to join the Atelier Douce community.',
                content: `
                            <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #171717; margin-bottom: 8px;">Welcome to the Community</h2>
                            <div class="accent-line"></div>
                            <p style="color: #5e5e5e; margin-bottom: 32px;">
                                To complete your subscription and receive your exclusive discount code, please confirm your email address below.
                            </p>
                            <div style="margin-top: 30px;">
                                <a href="${verifyLink}" class="btn">
                                    Confirm Subscription
                                </a>
                            </div>
                        `
            })
        });

        console.log('Resend response:', data);

        if (data.error) {
            console.error('Resend API Error Data:', data.error);
            throw new Error('Failed to send email');
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Subscribe API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
