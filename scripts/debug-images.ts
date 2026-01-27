
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspect() {
    const { data: products, error } = await supabase.from('products').select('id, name, images');
    if (error) {
        console.error(error);
        return;
    }

    let corrupted = 0;
    let clean = 0;

    for (const p of products) {
        if (Array.isArray(p.images) && p.images.length > 0) {
            const first = p.images[0];
            if (typeof first === 'string' && first.startsWith('[')) {
                console.log(`❌ Corrupted (Double Encoded): ${p.name} (${p.id})`);
                // console.log('   Value:', first);
                corrupted++;
            } else {
                // console.log(`✅ Clean: ${p.name}`);
                clean++;
            }
        } else if (!p.images) {
            console.log(`⚠️ No images: ${p.name}`);
        }
    }
    console.log(`\nSummary: ${corrupted} corrupted, ${clean} clean.`);
}

inspect();
