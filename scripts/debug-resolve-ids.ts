
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    // 1. Check for the Hat ID in Supabase
    const { data: hatByCJ } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', '1735282529143365632');

    console.log('--- Hat Hunt ---');
    console.log('CJ ID 1735282529143365632:', hatByCJ?.length ? hatByCJ[0].name : 'Not Found');

    const { data: hatByCJ2 } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', '1550458464835743744'); // Octagonal
    console.log('CJ ID 1550458464835743744:', hatByCJ2?.length ? hatByCJ2[0].name : 'Not Found');


    // 2. Check for the "Blue Puffer" (Targeted in fix-puffer-images.ts)
    const { data: bluePuffer } = await supabase
        .from('products')
        .select('*')
        .eq('id', '8b9401e2-23b0-4a9a-a57b-f84e4e11a186');

    console.log('\n--- Blue Puffer Hunt ---');
    if (bluePuffer && bluePuffer.length) {
        console.log(`Supabase ID: 8b9401e2-23b0-4a9a-a57b-f84e4e11a186`);
        console.log(`Name: ${bluePuffer[0].name}`);
        console.log(`CJ ID: ${bluePuffer[0].cj_product_id}`);
        console.log(`Current Image [0]: ${bluePuffer[0].images?.[0]}`);
    } else {
        console.log('ID 8b9401e2... not found.');
    }

    // 3. Search for "Puffer" generally
    const { data: puffers } = await supabase.from('products').select('id, cj_product_id, name').ilike('name', '%puffer%');
    console.log('\n--- All Puffers ---');
    puffers?.forEach(p => console.log(`${p.name} (${p.cj_product_id})`));

    // 4. Search for "Coat" generally
    const { data: coats } = await supabase.from('products').select('id, cj_product_id, name').ilike('name', '%coat%');
    console.log('\n--- All Coats ---');
    coats?.forEach(p => console.log(`${p.name} (${p.cj_product_id})`));
}

main().catch(console.error);
