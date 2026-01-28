
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('🔍 Inspecting Blue Puffer...');
    // CJ ID for Blue Puffer: 2511300843381609000
    // Or use the UUID from the script: 8b9401e2-23b0-4a9a-a57b-f84e4e11a186

    // 1. Search by CJ ID
    const { data: byCj, error: cjErr } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', '2511300843381609000')
        .single();

    if (byCj) {
        console.log('✅ Found by CJ ID:');
        console.log('ID:', byCj.id);
        console.log('Name:', byCj.name);
        console.log('Images:', JSON.stringify(byCj.images, null, 2));
    } else {
        console.log('❌ Not found by CJ ID');
    }

    // 2. Search by UUID from script
    const { data: byId, error: idErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', '8b9401e2-23b0-4a9a-a57b-f84e4e11a186')
        .single();

    if (byId) {
        console.log('\n✅ Found by UUID (8b94...):');
        console.log('ID:', byId.id);
        console.log('Name:', byId.name);
        console.log('Images:', JSON.stringify(byId.images, null, 2));
    } else {
        console.log('\n❌ Not found by UUID (8b94...)');
    }
}

main().catch(console.error);
