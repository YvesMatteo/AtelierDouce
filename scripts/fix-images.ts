
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fix() {
    const { data: products, error } = await supabase.from('products').select('id, name, images');
    if (error) {
        console.error(error);
        return;
    }

    let count = 0;
    for (const p of products) {
        if (Array.isArray(p.images) && p.images.length > 0) {
            const first = p.images[0];
            // Log what we see for corrupted ones
            if (typeof first === 'string' && first.trim().startsWith('[')) {
                console.log(`Found candidate: ${p.name}, length: ${p.images.length}`);

                try {
                    const cleanImages = JSON.parse(first);
                    if (Array.isArray(cleanImages)) {
                        console.log(`   -> Parsed successfully. Updating...`);
                        const { error: updateError } = await supabase
                            .from('products')
                            .update({ images: cleanImages })
                            .eq('id', p.id);

                        if (updateError) {
                            console.error(`   ❌ Failed update:`, updateError);
                        } else {
                            console.log(`   ✅ Fixed.`);
                            count++;
                        }
                    }
                } catch (e) {
                    console.error(`   ❌ Parse error:`, e.message);
                }
            }
        }
    }
    console.log(`\nFixed ${count} products.`);
}

fix();
