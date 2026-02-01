
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const OTHER_ID = 'a4ff2c89-d821-434f-8578-817075daccf8'; // Soft Fit Knit Coat

async function main() {
    const { data } = await supabase.from('products').eq('id', OTHER_ID).single();
    console.log('Images:', data.images);
}

main();
