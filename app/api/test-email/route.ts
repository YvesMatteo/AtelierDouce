
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
    try {
        const user = process.env.GMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!user || !pass) {
            return NextResponse.json({
                error: 'Missing Credentials',
                details: {
                    hasUser: !!user,
                    hasPass: !!pass
                }
            }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
        });

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) reject(error);
                else resolve(success);
            });
        });

        // Send Test Email
        const info = await transporter.sendMail({
            from: user,
            to: user,
            subject: '🔍 Test Email from Vercel Production',
            html: '<h1>It Works!</h1><p>Your Vercel environment correctly has access to Gmail.</p>',
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId,
            config: { user: user } // Safe to show user back to them
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
