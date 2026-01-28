
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSliver() {
    console.log('Searching for "sliver" in products...');

    // Check product name and description
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, options, cj_variant_id')
        .or('name.ilike.%sliver%,description.ilike.%sliver%');

    if (error) {
        console.error('Error searching text fields:', error);
    } else if (products && products.length > 0) {
        console.log('Found in name/description:', products);
    } else {
        console.log('Not found in name/description via simple query.');
    }

    // Check options JSONB. This is harder to do with simple filters if it's deep in json.
    // We'll fetch all products and scan them in memory since dataset is likely small enough for this script.
    const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('*');

    if (allError) {
        console.error('Error fetching all products:', allError);
        return;
    }

    const matches = [];
    for (const p of allProducts) {
        const str = JSON.stringify(p).toLowerCase();
        if (str.includes('sliver')) {
            matches.push({ id: p.id, name: p.name });
            console.log(`Found "sliver" in product ${p.id} (${p.name})`);

            // Helper to find key
            function findKeyInObject(obj: any, target: string, path: string = '') {
                if (typeof obj === 'string') {
                    if (obj.toLowerCase().includes(target)) {
                        console.log(`Found in ${path}: "${obj}"`);
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach((item, index) => findKeyInObject(item, target, `${path}[${index}]`));
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        findKeyInObject(obj[key], target, `${path}.${key}`);
                    }
                }
            }
            findKeyInObject(p, 'sliver');
            // console.log(JSON.stringify(p, null, 2));

            // Let's specifically look at options
            if (p.options) {
                console.log('Options:', JSON.stringify(p.options, null, 2));
            }
        }
    }
}

findSliver();
