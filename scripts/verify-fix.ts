
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    console.log('--- Verification ---');

    // 1. Blue Puffer (Front facing check)
    const { data: blue } = await supabase.from('products').select('*').eq('cj_product_id', '2511300843381609000').single();
    if (blue) {
        console.log(`Blue Puffer (${blue.name}):`);
        console.log(`  Image[0]: ${blue.images?.[0]}`);
        const isCorrect = blue.images?.[0]?.includes('a17ecca0');
        console.log(`  ✅ Correct? ${isCorrect}`);
    } else {
        console.log('❌ Blue Puffer NOT found');
    }

    // 2. Brown Fur Coat (White BG check)
    const { data: brown } = await supabase.from('products').select('*').eq('cj_product_id', '2501070601131628700').single();
    if (brown) {
        console.log(`\nBrown Puffer (${brown.name}):`);
        console.log(`  Image[0]: ${brown.images?.[0]}`);
        const isCorrect = brown.images?.[0]?.includes('brown-fur-jacket-white.png');
        console.log(`  ✅ Correct? ${isCorrect}`);
    } else {
        console.log('❌ Brown Puffer NOT found');
    }

    // 3. Hat Check (Should be gone)
    const { data: hat } = await supabase.from('products').select('*').eq('cj_product_id', '1735282529143365632');
    console.log(`\nHat Count: ${hat?.length} (Should be 0)`);
}

main().catch(console.error);
