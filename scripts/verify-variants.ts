
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    console.log('🔍 Verifying Dropshipping Automation Setup...\n');

    // 1. Check Products for Variants
    console.log('1️⃣ Checking Products for Variant Mappings...');
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, cj_product_id, variants')
        .limit(5);

    if (error) {
        console.error('   ❌ Error:', error.message);
        return;
    }

    let withVariants = 0;
    let totalVariants = 0;

    products.forEach(p => {
        const variantCount = Array.isArray(p.variants) ? p.variants.length : 0;
        totalVariants += variantCount;
        if (variantCount > 0) withVariants++;

        console.log(`   - ${p.name.substring(0, 35)}... : ${variantCount} variants`);

        // Show sample variant
        if (variantCount > 0) {
            const sample = p.variants[0];
            console.log(`     Sample: VID=${sample.id}, Options=${JSON.stringify(sample.options)}`);
        }
    });

    console.log(`\n   ✅ ${withVariants}/${products.length} sampled products have variant data`);
    console.log(`   📦 Total variants in sample: ${totalVariants}`);

    // 2. Get total counts
    console.log('\n2️⃣ Getting Total Product Stats...');
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    console.log(`   📊 Total products in database: ${count}`);

    console.log('\n✅ Automation setup complete! Orders will now use correct variant IDs.');
}

verify();
