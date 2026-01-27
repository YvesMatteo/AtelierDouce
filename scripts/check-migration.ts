
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function runMigration() {
    console.log('🔄 Checking if variants column exists...');

    // Try to query a product with variants column
    const { data, error } = await supabase
        .from('products')
        .select('id, variants')
        .limit(1);

    if (error && error.message.includes('variants')) {
        console.log('❌ Variants column does not exist. Please run this SQL in Supabase:');
        console.log('\n  ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT \'[]\';');
        console.log('\n');
        process.exit(1);
    } else if (error) {
        console.error('Database error:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Variants column exists!');
        console.log('   Current value sample:', JSON.stringify(data?.[0]?.variants || []));
    }
}

runMigration();
