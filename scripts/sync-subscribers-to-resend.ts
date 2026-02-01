import { createClient } from '@supabase/supabase-js';
import { resend, RESEND_AUDIENCE_ID } from '../lib/resend';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncSubscribers() {
    if (!process.env.RESEND_AUDIENCE_ID) {
        console.error('❌ RESEND_AUDIENCE_ID is missing in .env');
        process.exit(1);
    }

    console.log('🔄 Fetching verified subscribers from Supabase...');

    const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('email')
        .eq('verified', true);

    if (error) {
        console.error('❌ Error fetching subscribers:', error);
        process.exit(1);
    }

    console.log(`📦 Found ${subscribers.length} verified subscribers.`);

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscribers) {
        try {
            console.log(`⏳ Syncing ${sub.email}...`);
            await resend.contacts.create({
                email: sub.email,
                audienceId: process.env.RESEND_AUDIENCE_ID!,
                unsubscribed: false,
            });
            console.log(`✅ Synced ${sub.email}`);
            successCount++;
        } catch (err: any) {
            console.error(`❌ Failed to sync ${sub.email}:`, err.message);
            failCount++;
        }
    }

    console.log('--------------------------------------------------');
    console.log(`🎉 Sync Complete!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

syncSubscribers();
