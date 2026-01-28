
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, description, images')
        .order('name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    let output = '# Current Products\n\n| ID | Name | Category | Description | Image Hint |\n|---|---|---|---|---|\n';
    products.forEach(p => {
        const imgHint = p.images && p.images.length > 0 ? p.images[0].split('/').pop() : 'No Image';
        const descPreview = p.description ? p.description.slice(0, 50).replace(/\n/g, ' ') + '...' : 'No Desc';
        output += `| ${p.id} | ${p.name} | ${p.category || 'NULL'} | ${descPreview} | ${imgHint} |\n`;
    });

    const outputPath = path.join(process.cwd(), 'current_products_list.md');
    fs.writeFileSync(outputPath, output);
    console.log(`Product list written to ${outputPath}`);
}

main();
