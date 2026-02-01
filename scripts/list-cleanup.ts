
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    // 1. Fetch all products
    const { data: allProducts } = await supabase.from('products').select('id, name, is_active, created_at, images');

    if (!allProducts) {
        console.log('No products found');
        return;
    }

    // 2. Identify "Unused"
    // User definition: "not displayed on our website".
    // Website logic: matches `is_active: true`.
    // So unused = is_active: false.

    const activeProducts = allProducts.filter(p => p.is_active);
    const inactiveProducts = allProducts.filter(p => !p.is_active);

    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Active (Displayed): ${activeProducts.length}`);
    console.log(`Inactive (To Delete): ${inactiveProducts.length}`);

    console.log('\n--- INACTIVE PRODUCTS TO DELETE ---');
    inactiveProducts.forEach(p => {
        console.log(`[DELETE] ${p.name} (ID: ${p.id}, Active: ${p.is_active})`);
    });
}

main();
