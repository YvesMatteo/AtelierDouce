import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = 'Atelier Douce <support@atelierdouce.shop>';
// Recommendation: Update this to 'Atelier Douce <hello@atelierdouce.shop>' once domain is verified
