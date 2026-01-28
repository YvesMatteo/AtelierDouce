import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    // Get all products with full details
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('=== ALL PRODUCTS ===\n');
    products.forEach((p, i) => {
        const hasStripe = p.stripe_product_id && p.stripe_price_id;
        const hasVariants = p.variants && p.variants.length > 0;
        const isActive = p.is_active;
        const inventory = p.inventory || 0;

        let issues = [];
        if (!hasStripe) issues.push('NO_STRIPE');
        if (!hasVariants) issues.push('NO_VARIANTS');
        if (!isActive) issues.push('INACTIVE');
        if (inventory <= 0) issues.push('NO_STOCK');

        const status = issues.length > 0 ? `⚠️ ${issues.join(', ')}` : '✅';
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Status: ${status}`);
        console.log(`   Variants: ${p.variants?.length || 0}, Inventory: ${inventory}`);
        console.log('');
    });

    // Find jacket products
    console.log('\n=== JACKET/PUFFER PRODUCTS ===\n');
    const jackets = products.filter(p =>
        p.name.toLowerCase().includes('jacket') ||
        p.name.toLowerCase().includes('puffer') ||
        p.name.toLowerCase().includes('coat')
    );
    jackets.forEach(p => {
        console.log(`${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Images: ${p.images?.length || 0}`);
        if (p.images && p.images.length > 0) {
            console.log(`   First image: ${p.images[0]}`);
        }
        console.log('');
    });
}

main().catch(console.error);
