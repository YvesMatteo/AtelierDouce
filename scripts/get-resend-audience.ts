import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function setupAudience() {
    try {
        console.log('🔍 Checking existing audiences...');
        const { data: audiences, error } = await resend.audiences.list();

        if (error) {
            console.error('❌ Error listing audiences:', error);
            process.exit(1);
        }

        if (audiences && audiences.length > 0) {
            const audience = audiences[0];
            console.log(`✅ Found existing audience: "${audience.name}" (ID: ${audience.id})`);
            console.log(`👉 Add this to your .env: RESEND_AUDIENCE_ID=${audience.id}`);
            return;
        }

        console.log('⚠️ No audiences found. Creating "General" audience...');
        const { data: newAudience, error: createError } = await resend.audiences.create({
            name: 'General',
        });

        if (createError) {
            console.error('❌ Error creating audience:', createError);
            process.exit(1);
        }

        console.log(`🎉 Created new audience: "General" (ID: ${newAudience?.id})`);
        console.log(`👉 Add this to your .env: RESEND_AUDIENCE_ID=${newAudience?.id}`);

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
    }
}

setupAudience();
