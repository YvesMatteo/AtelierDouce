import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function auditProducts() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    const auditData = products.map(p => {
        const colorOptions = p.options?.find((o: any) => o.name === 'Color' || o.name === 'Colour')?.values || [];
        const variantColors = p.variants?.map((v: any) => v.options?.Color || v.options?.Colour).filter(Boolean) || [];

        return {
            id: p.id,
            name: p.name,
            options_colors: colorOptions,
            variant_colors: [...new Set(variantColors)],
            images_count: p.images?.length || 0,
            images: p.images,
            cj_id: p.cj_product_id
        };
    });

    console.log(JSON.stringify(auditData, null, 2));
}

auditProducts().catch(console.error);
