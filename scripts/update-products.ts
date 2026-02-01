import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CSV_PATH = path.join(process.cwd(), '../Produkt Liste.csv');

// Manual mapping for products that don't match exactly by name
// DB Name -> CSV Name
const NAME_MAPPING: Record<string, string> = {
    "Loose Fit Gray Coat": "Soft Fit Knit Coat",
    "Loose Fit Camel Coat": "Timeless Camel Wool Coat",
    "Classic Multi-Color Handbag": "Classic Soft Hobo Bag",
    "Khaki Red Heeled Shoes": "Elegant Slouch Heel Boots",
    "Brown Hooded Warm Jacket": "Fur Hood Winter Jacket",
    "Premium Down Jacket": "Oversized Puffer Down Jacket",
    "Detachable Hooded Puffer Coat": "Luxe Long Down Coat",
    "Classic Short Coat": "Paris Short Elegant Coat",
    "Pearl Single-Layer Necklace": "Pearl Minimal Necklace",
    "Modern White Khaki Bag": "Clean White Mini Bag",
    "Platform Snow Boots": "Plush Winter Boots",
    "Imitation Cashmere Scarf": "Soft Cashmere Touch Scarf",
    "Minimalist Hoop Circle Earrings": "Vintage Metal Hoop Earrings",
    "Stylish Design Sneakers": "Urban Winter Sneakers",
    "Winter Cotton Lined Boots": "Soft Suede Ankle Boots",
    // Ski suits and others not in CSV will be skipped
};

async function updateProducts() {
    const isPreview = process.argv.includes('--preview');
    console.log(`🚀 Starting product update ${isPreview ? '(PREVIEW MODE)' : ''}...`);

    // 1. Read CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    const csvProducts: Record<string, number> = {};

    lines.slice(1).forEach(line => {
        // Simple CSV parse handling comma inside quotes if needed, but for now simple split might suffice if no commas in names
        // Better: use a regex to split by comma ignoring commas in quotes/parentheses
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        let name = parts[2]?.trim();
        let priceStr = parts[4]?.trim();

        if (name && priceStr) {
            // Remove quotes if present
            name = name.replace(/^"|"$/g, '');
            // Handle price range or simple price. If range, take the lowest? Or the provided "Sell" price usually is single.
            // In the CSV: "51.82" -> "129". "6.22 – 11.44" -> "29".
            // It seems "Sell" is always a single number in the example.
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
                csvProducts[name] = price;
            }
        }
    });

    console.log(`Loaded ${Object.keys(csvProducts).length} products from CSV.`);

    // 2. Fetch DB Products
    const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching DB products:', error);
        return;
    }

    console.log(`Found ${dbProducts.length} products in DB.`);

    // 3. Match and Update
    for (const p of dbProducts) {
        let csvName = p.name;

        // Try exact match
        let newPrice = csvProducts[p.name];

        // Try mapping
        if (newPrice === undefined) {
            // Check if we have a manual mapping
            const mappedName = NAME_MAPPING[p.name];
            if (mappedName && csvProducts[mappedName]) {
                csvName = mappedName;
                newPrice = csvProducts[mappedName];
            }
        }

        // Try fuzzy / partial match if needed (e.g. normalize spaces)
        if (newPrice === undefined) {
            const normalizedDB = p.name.toLowerCase().trim();
            const foundKey = Object.keys(csvProducts).find(k => k.toLowerCase().trim() === normalizedDB);
            if (foundKey) {
                csvName = foundKey;
                newPrice = csvProducts[foundKey];
            }
        }

        if (newPrice !== undefined) {
            const priceDiff = newPrice !== p.price;
            if (priceDiff || p.name !== csvName) {
                console.log(`\nMATCH: "${p.name}" -> CSV: "${csvName}"`);
                console.log(`  Current Price: ${p.price} -> New Price: ${newPrice}`);

                if (!isPreview) {
                    // Update main record
                    const { data: updatedData, error: updateError } = await supabase
                        .from('products')
                        .update({
                            price: newPrice,
                            // Optionally update name to match CSV exactly? User asked to "fix names" too.
                            name: csvName
                        })
                        .eq('id', p.id)
                        .select();

                    if (updateError) {
                        console.error(`  ❌ Error updating product ${p.id}:`, updateError.message);
                    } else if (updatedData && updatedData.length > 0) {
                        console.log(`  ✅ Updated product record: ${updatedData[0].name} - ${updatedData[0].price}`);
                    } else {
                        console.log(`  ⚠️ Update executed but no rows returned (RLS or no change?).`);
                    }

                    // Update variants
                    if (p.variants && Array.isArray(p.variants)) {
                        const updatedVariants = p.variants.map((v: any) => ({
                            ...v,
                            price: newPrice
                        }));

                        const { error: variantError } = await supabase
                            .from('products')
                            .update({ variants: updatedVariants })
                            .eq('id', p.id);

                        if (variantError) {
                            console.error(`  ❌ Error updating variants for ${p.id}:`, variantError.message);
                        } else {
                            console.log(`  ✅ Updated variants.`);
                        }
                    }
                }
            } else {
                console.log(`OK: "${p.name}" matches.`);
            }
        } else {
            console.log(`⚠️ NO MATCH FOUND for DB Product: "${p.name}"`);
        }
    }
}

updateProducts();
