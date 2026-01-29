import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const productsToFind = [
        'Imitation Cashmere Scarf',
        'Sheepskin Lined Boots',
        'Khaki Red Heeled Shoes',
        'Elegant Beige Black Bag'
    ];

    console.log('Searching for products...');

    for (const name of productsToFind) {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, images')
            .ilike('name', `%${name}%`)
            .limit(1);

        if (error) {
            console.error(`Error finding ${name}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`\nFound: ${data[0].name} (${data[0].id})`);
            console.log('Images:', data[0].images);
        } else {
            console.log(`\nNot found: ${name}`);
        }
    }
}

main().catch(console.error);
