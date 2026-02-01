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

interface CSVData {
    price?: number;
    compareAtPrice?: number;
}

async function updateProducts() {
    const isPreview = process.argv.includes('--preview');
    console.log(`🚀 Starting product update ${isPreview ? '(PREVIEW MODE)' : ''}...`);

    // 1. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found at ${CSV_PATH}`);
        return;
    }
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    const csvProducts: Record<string, CSVData> = {};

    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        let name = parts[2]?.trim();
        let priceStr = parts[4]?.trim();
        let compareAtStr = parts[5]?.trim();

        if (name && (priceStr || compareAtStr)) {
            name = name.replace(/^"|"$/g, '');

            const price = parseFloat(priceStr);

            // Extract number from "179 (28%)" or "34 (29%)"
            let compareAtPrice = undefined;
            if (compareAtStr) {
                const match = compareAtStr.match(/(\d+(\.\d+)?)/);
                if (match) {
                    compareAtPrice = parseFloat(match[1]);
                }
            }

            csvProducts[name] = {
                price: !isNaN(price) ? price : undefined,
                compareAtPrice
            };
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
        let csvData = csvProducts[p.name];

        // Try mapping
        if (!csvData) {
            const mappedName = NAME_MAPPING[p.name];
            if (mappedName && csvProducts[mappedName]) {
                csvName = mappedName;
                csvData = csvProducts[mappedName];
            }
        }

        // Try fuzzy / partial match
        if (!csvData) {
            const normalizedDB = p.name.toLowerCase().trim();
            const foundKey = Object.keys(csvProducts).find(k => k.toLowerCase().trim() === normalizedDB);
            if (foundKey) {
                csvName = foundKey;
                csvData = csvProducts[foundKey];
            }
        }

        if (csvData) {
            const { price: newPrice, compareAtPrice: newCompareAtPrice } = csvData;
            const priceDiff = newPrice !== undefined && newPrice !== p.price;
            const compareAtDiff = newCompareAtPrice !== undefined && newCompareAtPrice !== p.compare_at_price;

            if (priceDiff || compareAtDiff || p.name !== csvName) {
                console.log(`\nMATCH: "${p.name}" -> CSV: "${csvName}"`);
                if (priceDiff) console.log(`  Price: ${p.price} -> ${newPrice}`);
                if (compareAtDiff) console.log(`  CompareAt: ${p.compare_at_price} -> ${newCompareAtPrice}`);

                if (!isPreview) {
                    const updateData: any = { name: csvName };
                    if (newPrice !== undefined) updateData.price = newPrice;
                    if (newCompareAtPrice !== undefined) updateData.compare_at_price = newCompareAtPrice;

                    const { data: updatedData, error: updateError } = await supabase
                        .from('products')
                        .update(updateData)
                        .eq('id', p.id)
                        .select();

                    if (updateError) {
                        console.error(`  ❌ Error updating product ${p.id}:`, updateError.message);
                    } else if (updatedData && updatedData.length > 0) {
                        console.log(`  ✅ Updated product record: ${updatedData[0].name} - ${updatedData[0].price} (CompareAt: ${updatedData[0].compare_at_price})`);
                    }

                    // Update variants
                    if (p.variants && Array.isArray(p.variants) && newPrice !== undefined) {
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
            }
        }
    }
}

updateProducts();
