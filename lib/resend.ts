import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = 'Atelier Douce <support@atelierdouce.shop>';
// Recommendation: Update this to 'Atelier Douce <hello@atelierdouce.shop>' once domain is verified

export const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function addSubscriber(email: string) {
    if (!RESEND_AUDIENCE_ID) {
        console.warn('⚠️ RESEND_AUDIENCE_ID is not defined. Skipping audience sync.');
        return;
    }

    try {
        await resend.contacts.create({
            email: email,
            audienceId: RESEND_AUDIENCE_ID,
            unsubscribed: false,
        });
        console.log(`✅ Added ${email} to Resend Audience.`);
    } catch (error) {
        console.error('❌ Failed to add subscriber to Resend:', error);
    }
}
