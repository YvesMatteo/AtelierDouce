import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    console.error('Missing Stripe credentials.');
    process.exit(1);
}
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
});

const ANALYSIS_FILE = path.join(process.cwd(), 'product_pricing_analysis.md');

interface ProductUpdate {
    cjId: string;
    name: string;
    price: number;
    image: string;
}

// Function to parse the Markdown file
function parseAnalysisFile(): ProductUpdate[] {
    const content = fs.readFileSync(ANALYSIS_FILE, 'utf-8');
    const lines = content.split('\n');
    const updates: ProductUpdate[] = [];

    // Regex to match the table row
    // Example: | 1 | <img src="..." .../> | **Name** | $123.45 | ... | [Link](...p-12345.html) |
    const rowRegex = /\| \d+ \| <img src="([^"]+)"[^>]*\/> \| \*\*([^*]+)\*\* \| \$([\d.]+) \|.*?\| \[Link\]\(([^)]+)\) \|/;

    for (const line of lines) {
        const match = line.match(rowRegex);
        if (match) {
            const imageUrl = match[1];
            const name = match[2].trim();
            const price = parseFloat(match[3]);
            const link = match[4];

            // Extract ID from link
            // Link formats might vary: ...-p-12345.html or just /12345.html
            // The file shows: ...-p-2000862978889248769.html
            const idMatch = link.match(/p-(\d+)\.html/);
            const idMatchAlt = link.match(/-(\d+)\.html/); // Fallback

            let cjId = '';
            if (idMatch) {
                cjId = idMatch[1];
            } else if (idMatchAlt) {
                // The last group of digits before .html
                const parts = link.split('-');
                const lastPart = parts[parts.length - 1];
                cjId = lastPart.replace('.html', '');
            }

            if (cjId) {
                updates.push({ cjId, name, price, image: imageUrl });
            }
        }
    }
    return updates;
}

async function main() {
    console.log('🚀 Starting product fix based on analysis file...');

    const updates = parseAnalysisFile();
    console.log(`📋 Found ${updates.length} products to classify/update.`);

    for (const update of updates) {
        console.log(`\nProcessing ${update.cjId} ("${update.name}")...`);

        // 1. Find in Supabase
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('cj_product_id', update.cjId);

        if (error) {
            console.error(`Error querying Supabase for ${update.cjId}:`, error.message);
            continue;
        }

        if (!products || products.length === 0) {
            console.warn(`⚠️ Product ${update.cjId} not found in Supabase. Skipping.`);
            continue;
        }

        const product = products[0];
        console.log(`   Found in Supabase: ${product.name} (Stripe ID: ${product.stripe_product_id})`);

        // 2. Prepare Updates
        const currentImages = product.images || [];
        const newMainImage = update.image;

        // Ensure newMainImage is first
        let newImages = [...currentImages];
        if (newImages.includes(newMainImage)) {
            // Move to front
            newImages = newImages.filter(img => img !== newMainImage);
            newImages.unshift(newMainImage);
        } else {
            // Add to front
            newImages.unshift(newMainImage);
        }

        // 3. Update Stripe Product
        if (product.stripe_product_id) {
            try {
                // Update Product Name, Description, Images
                await stripe.products.update(product.stripe_product_id, {
                    name: update.name,
                    // description: update.name, // Keep existing description or update? Let's keep existing for now unless empty.
                    images: newImages.slice(0, 8), // Stripe limit
                });
                console.log('   ✅ Updated Stripe Product (Name, Images)');

                // Update Price
                // Check if price matches
                // We need to fetch ID of current price or just create a new one and update default_price
                // Simplest: Create new price, update product default_price.
                const newPriceMethods = Math.round(update.price * 100);

                // Create new price
                const price = await stripe.prices.create({
                    product: product.stripe_product_id,
                    unit_amount: newPriceMethods,
                    currency: 'usd',
                });

                // Update product default price
                await stripe.products.update(product.stripe_product_id, {
                    default_price: price.id
                });
                console.log(`   ✅ Updated Stripe Price to $${update.price}`);

                // Update Supabase
                await supabase
                    .from('products')
                    .update({
                        name: update.name,
                        price: update.price,
                        images: newImages,
                        stripe_price_id: price.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', product.id);
                console.log('   ✅ Updated Supabase record');

            } catch (err: any) {
                console.error(`   ❌ Error updating Stripe/Supabase: ${err.message}`);
            }
        } else {
            console.warn('   ⚠️ No Stripe Product ID found in Supabase.');
        }
    }

    console.log('\n✨ Done.');
}

main().catch(console.error);
