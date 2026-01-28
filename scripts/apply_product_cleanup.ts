
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAPPING = [
    {
        matcher: (p: any) => p.name === 'Down Jacket' && p.description?.includes('Premium Down Jacket'),
        updates: { name: 'Premium Down Jacket', category: 'Clothing' }
    },

    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && p.description?.includes('Metal') && p.description?.includes('Vintage'),
        updates: { name: 'Vintage Metal Style Top', category: 'Clothing' }
    },
    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && (p.description?.includes('Milky White') || p.description?.includes('socks')),
        updates: { name: 'Milky White Mid-Calf Socks', category: 'Accessories' }
    },
    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && p.description?.includes('polyester'),
        updates: { name: 'Leisure Polyester Top', category: 'Clothing' }
    },
    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && p.description?.includes('Warp knitting'),
        updates: { name: 'Knitted Warp Top', category: 'Clothing' }
    },
    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && p.description?.includes('imitation cashmere'),
        updates: { name: 'Imitation Cashmere Scarf', category: 'Accessories' }
    },
    {
        matcher: (p: any) => p.name === 'Elegant Collection Piece' && p.description?.includes('Nylon') && p.description?.includes('light blue'),
        updates: { name: 'Light Blue Nylon Windbreaker', category: 'Clothing' }
    },

    {
        matcher: (p: any) => p.name.includes('Hood Warm Jacket Brown'),
        updates: { name: 'Brown Hooded Warm Jacket', category: 'Clothing' }
    },

    {
        matcher: (p: any) => p.id === '9dae65a1-e8c2-454d-b9a7-6032bf7936ee',
        updates: { name: 'Pink Casual Fashion Bag', category: 'Bags' }
    },
    {
        matcher: (p: any) => p.name === 'Luxury Fashion Bag' && p.description?.includes('Bear logo'),
        updates: { name: 'Bear Logo Pattern Bag', category: 'Bags' }
    },
    {
        matcher: (p: any) => p.name === 'Luxury Fashion Bag' && p.description?.includes('brown') && p.description?.includes('black') && p.images?.some((i: string) => i.includes('1623910867040')),
        updates: { name: 'Classic Multi-Color Handbag', category: 'Bags' }
    },
    {
        matcher: (p: any) => p.name === 'Luxury Fashion Bag' && p.description?.includes('White') && p.description?.includes('khaki'),
        updates: { name: 'Modern White Khaki Bag', category: 'Bags' }
    },
    {
        matcher: (p: any) => p.name === 'Luxury Fashion Bag' && p.description?.includes('beige') && p.description?.includes('black'),
        updates: { name: 'Elegant Beige Black Bag', category: 'Bags' }
    },
    {
        matcher: (p: any) => p.name === 'Luxury Fashion Bag' && p.description?.includes('Black') && p.description?.includes('gray') && p.description?.includes('Solid color'),
        updates: { name: 'Solid Color Premium Bag', category: 'Bags' }
    },

    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Cotton') && p.images?.some((i: string) => i.includes('e9b5af5a')),
        updates: { name: 'Winter Cotton Lined Boots', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Khaki') && p.description?.includes('Red'),
        updates: { name: 'Khaki Red Heeled Shoes', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('velboa'),
        updates: { name: 'Dark Brown Velboa Boots', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Unique design'),
        updates: { name: 'Stylish Design Sneakers', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Microfiber'),
        updates: { name: 'Microfiber Casual Shoes', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Artificial short plush'),
        updates: { name: 'Plush Lined Winter Shoes', category: 'Shoes' }
    },
    {
        matcher: (p: any) => p.name === 'Premium Footwear' && p.description?.includes('Sheared sheepskin'),
        updates: { name: 'Sheepskin Lined Boots', category: 'Shoes' }
    },

    {
        matcher: (p: any) => p.name === 'Short Coat',
        updates: { name: 'Classic Short Coat', category: 'Clothing' }
    },

    {
        matcher: (p: any) => p.name.includes('Pearl Single-layer Necklace'),
        updates: { name: 'Pearl Single-Layer Necklace', category: 'Jewelry' }
    },
    {
        matcher: (p: any) => p.name.includes('Small Star Studded'),
        updates: { name: 'Star Studded Diamond Tag', category: 'Jewelry' }
    },

    {
        matcher: (p: any) => p.name === 'Stylish Outerwear' && p.description?.includes('3D effect'),
        updates: { name: '3D Effect Patterned Jacket', category: 'Clothing' }
    },
    {
        matcher: (p: any) => p.name === 'Stylish Outerwear' && p.description?.includes('camel') && p.description?.includes('black'),
        updates: { name: 'Loose Fit Camel Coat', category: 'Clothing' }
    },
    {
        matcher: (p: any) => p.name === 'Stylish Outerwear' && p.description?.includes('gray') && p.description?.includes('brown'),
        updates: { name: 'Loose Fit Gray Coat', category: 'Clothing' }
    },
];

async function main() {
    console.log("Fetching products to update...");
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error || !products) {
        console.error("Error fetching products", error);
        return;
    }

    let updatedCount = 0;

    for (const product of products) {
        let matched = false;
        for (const rule of MAPPING) {
            if (rule.matcher(product)) {
                console.log(`Updating '${product.name}' -> '${rule.updates.name}' [${rule.updates.category}]`);

                const { error: updateError } = await supabase
                    .from('products')
                    .update(rule.updates)
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`  Failed to update ${product.id}:`, updateError);
                } else {
                    updatedCount++;
                }
                matched = true;
                break; // One match per product
            }
        }
        if (!matched && (product.name === 'Elegant Collection Piece' || product.name === 'Luxury Fashion Bag')) {
            console.log(`WARNING: Unmatched generic product: ${product.name} (${product.id})`);
        }
    }

    console.log(`\nDone! Updated ${updatedCount} products.`);
}

main();
