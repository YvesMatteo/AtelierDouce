
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAPPINGS: Record<string, string> = {
    'Winter Outdoor Body Hoodie Ski Suit Coat Women': 'Clothing',
    "Women's New Professional Double-board Waterproof Ski Suit": 'Clothing', // Covers both Top/Bottom entries if name is unique
    'Timeless Camel Wool Coat': 'Clothing',
    'Oversized Puffer Down Jacket': 'Clothing',
    'Paris Short Elegant Coat': 'Clothing',
    'Brushed Fleece Leggings': 'Clothing',
    '3D Effect Patterned Jacket': 'Clothing',
    'Soft Fit Knit Coat': 'Clothing',
    'Soft Cashmere Touch Scarf': 'Accessories'
};

async function main() {
    console.log('Starting category updates...');

    for (const [name, newCategory] of Object.entries(MAPPINGS)) {
        console.log(`Updating "${name}" to "${newCategory}"...`);

        const { data, error } = await supabase
            .from('products')
            .update({ category: newCategory })
            .eq('name', name)
            .select();

        if (error) {
            console.error(`Error updating "${name}":`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Success: Updated ${data.length} row(s) for "${name}".`);
        } else {
            console.warn(`Warning: No product found with name "${name}".`);
        }
    }

    console.log('Category update complete.');
}

main();
