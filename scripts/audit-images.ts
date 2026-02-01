
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log('--- Auditing Product Images ---');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    let relativeCount = 0;
    let absoluteCount = 0;
    let problematicProducts: string[] = [];

    products.forEach(p => {
        if (!p.images || !Array.isArray(p.images)) return;

        const hasRelative = p.images.some((img: string) => !img.startsWith('http'));

        if (hasRelative) {
            relativeCount++;
            problematicProducts.push(`${p.name} (${p.id})`);
            console.log(`[RELATIVE] ${p.name}`);
            p.images.forEach((img: string) => {
                if (!img.startsWith('http')) console.log(`  - ${img}`);
            });
        } else {
            absoluteCount++;
        }
    });

    console.log('\n--- Summary ---');
    console.log(`Total Products Scanned: ${products.length}`);
    console.log(`Products with Absolute URLs (OK): ${absoluteCount}`);
    console.log(`Products with Relative URLs (Fixed by API): ${relativeCount}`);

    if (relativeCount > 0) {
        console.log('\nThe following products rely on the API fix to work with Stripe:');
        problematicProducts.forEach(name => console.log(`- ${name}`));
    }
}

main();
