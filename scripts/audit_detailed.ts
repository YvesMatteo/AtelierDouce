
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function audit() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, options, images');

    if (error) {
        console.error(error);
        return;
    }

    // Filter for products that might have variations
    const detailedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        image_count: p.images?.length || 0,
        images: p.images,
        options: p.options
    }));

    console.log(JSON.stringify(detailedProducts, null, 2));
}

audit();
