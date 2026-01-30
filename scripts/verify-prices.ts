import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Expected products based on implementation_plan.md (NEW names and prices)
const expectedProducts: Record<string, { price: number; category?: string }> = {
    'Luxe Long Down Coat': { price: 129, category: 'Tops & Bottoms' },
    'Soft Fit Knit Coat': { price: 49, category: 'Tops & Bottoms' },
    'Soft Cashmere Touch Scarf': { price: 24, category: 'Accessories' },
    'Timeless Camel Wool Coat': { price: 29, category: 'Tops & Bottoms' },
    'Classic Soft Hobo Bag': { price: 39, category: 'Bags' },
    'Paris Short Elegant Coat': { price: 39, category: 'Tops & Bottoms' },
    'Pearl Minimal Necklace': { price: 14, category: 'Jewelry' },
    'Clean White Mini Bag': { price: 29, category: 'Bags' },
    'Oversized Puffer Down Jacket': { price: 149, category: 'Tops & Bottoms' },
    'Vintage Metal Hoop Earrings': { price: 9, category: 'Jewelry' },
    'Fur Hood Winter Jacket': { price: 79, category: 'Tops & Bottoms' },
    'Elegant Slouch Heel Boots': { price: 49, category: 'Shoes' },
    'Lightweight Puffer Jacket': { price: 69, category: 'Tops & Bottoms' },
    'Cozy Handle Mini Bag': { price: 29, category: 'Bags' },
    'Urban Winter Sneakers': { price: 29, category: 'Shoes' },
    'Soft Suede Ankle Boots': { price: 49, category: 'Shoes' },
    'Plush Winter Boots': { price: 29, category: 'Shoes' },
    'Star Charm Necklace': { price: 19, category: 'Jewelry' },
    'Pink Cloud Puffer Jacket': { price: 79, category: 'Tops & Bottoms' },
};

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, price, category')
        .order('name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('\n=== PRODUCT VERIFICATION (Using NEW names from implementation plan) ===\n');

    let correct = 0;
    let incorrect = 0;
    let notFound = 0;

    // Check each expected product
    for (const [name, expected] of Object.entries(expectedProducts)) {
        const product = products?.find(p => p.name === name);
        if (!product) {
            console.log(`❌ NOT FOUND: ${name} (expected €${expected.price})`);
            notFound++;
        } else if (Math.abs(product.price - expected.price) < 0.01) {
            console.log(`✅ ${name}: €${product.price.toFixed(2)} | Category: ${product.category}`);
            correct++;
        } else {
            console.log(`❌ WRONG PRICE: ${name}: €${product.price.toFixed(2)} (expected €${expected.price})`);
            incorrect++;
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Correct: ${correct}/${Object.keys(expectedProducts).length}`);
    console.log(`❌ Incorrect: ${incorrect}`);
    console.log(`❓ Not Found: ${notFound}`);
    console.log(`Total products in DB: ${products?.length}`);

    // Show products not in expected list
    console.log('\n=== PRODUCTS NOT IN EXPECTED LIST ===\n');
    products?.forEach(p => {
        if (!expectedProducts[p.name]) {
            console.log(`📦 ${p.name}: €${p.price.toFixed(2)} | Category: ${p.category}`);
        }
    });
}

main();
