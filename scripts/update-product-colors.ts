// Script to restore and filter product variants
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getCJClient } from '../lib/cjdropshipping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAndFilterVariants() {
    const productId = '2ec94e02-4392-4b0f-a105-70c59427b8ce';
    const cjProductId = '2512240513531625200';

    // Colors to keep (exact match, case-insensitive)
    const colorsToKeep = ['black', 'coffee', 'beige', 'gray'];

    console.log('Fetching product data from CJ...');
    const cj = getCJClient();
    const cjProduct = await cj.getProductDetails(cjProductId);

    if (!cjProduct) {
        console.error('Could not fetch CJ product');
        return;
    }

    console.log('CJ Variants count:', cjProduct.variants?.length);

    // Get unique colors from variantKey (format: "Color-Size")
    const uniqueColors = [...new Set(cjProduct.variants?.map((v: any) => {
        const [color] = v.variantKey?.split('-') || [];
        return color;
    }).filter(Boolean))];
    console.log('Available colors from CJ:', uniqueColors);

    // Transform CJ variants to our format and filter
    const allVariants = cjProduct.variants?.map((v: any) => {
        const [color, size] = v.variantKey?.split('-') || [];
        return {
            id: v.vid,
            sku: v.variantSku,
            image: v.variantImage,
            price: 29, // Keep current price
            options: {
                Color: color,
                Size: size
            }
        };
    }) || [];

    // Filter to only keep specified colors
    const filteredVariants = allVariants.filter((v: any) =>
        colorsToKeep.includes(v.options.Color?.toLowerCase())
    );

    console.log('Filtered variants count:', filteredVariants.length);
    console.log('Filtered colors:', [...new Set(filteredVariants.map((v: any) => v.options.Color))]);

    // Update options
    const newOptions = [
        { name: 'Color', values: ['Black', 'Gray', 'Coffee', 'Beige'] },
        { name: 'Size', values: ['36to37', '38to39', '40to41', '42to43', '44to45'] }
    ];

    // Update the product in Supabase
    const { error } = await supabase
        .from('products')
        .update({
            options: newOptions,
            variants: filteredVariants
        })
        .eq('id', productId);

    if (error) {
        console.error('Error updating product:', error);
        return;
    }

    console.log('\n✅ Product updated successfully!');
    console.log(`Restored ${filteredVariants.length} variants with colors: Black, Gray, Coffee, Beige`);
}

restoreAndFilterVariants().catch(console.error);
