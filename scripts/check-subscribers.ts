
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscribers() {
    const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching subscribers:', error);
        return;
    }

    console.log(`Total Subscribers in DB: ${count}`);
}

checkSubscribers();
