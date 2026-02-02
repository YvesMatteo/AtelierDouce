
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_LINKS_PATH = path.join(process.cwd(), 'product_links.md');

async function main() {
    console.log("🔄 Starting sync of product_links.md with Supabase...");

    // 1. Fetch all products from Supabase
    const { data: dbProducts, error } = await supabase.from('products').select('*');
    if (error || !dbProducts) {
        console.error("❌ Error fetching products:", error);
        return;
    }
    console.log(`📦 Fetched ${dbProducts.length} products from DB.`);

    // Map products by Image URL for easy lookup
    // Normalize Supabase images: sometimes they might vary slightly, but usually direct match works.
    // We'll map ALL images of a product to that product.
    const productByImage = new Map<string, typeof dbProducts[0]>();

    for (const p of dbProducts) {
        if (p.images && Array.isArray(p.images)) {
            for (const img of p.images) {
                productByImage.set(img.trim(), p);
            }
        }
    }

    // 2. Read existing markdown
    if (!fs.existsSync(PRODUCT_LINKS_PATH)) {
        console.error("❌ product_links.md not found!");
        return;
    }
    let content = fs.readFileSync(PRODUCT_LINKS_PATH, 'utf-8');

    // 3. Process the file line by line (or by blocks) is safer to preserve structure.
    // However, regex replacement is easier for specific lines if we can identify the block.
    // The structure is:
    // #### Title
    // - **Product Thumbnail**: ![Alt](URL)
    // - **Website Price**: $PRICE

    // We will iterate through the content and reconstruct it or replace chunks.
    // Split by lines to process statefully.
    const lines = content.split('\n');
    const newLines: string[] = [];

    let currentUpdateMatchedProduct: typeof dbProducts[0] | null = null;
    let currentBlockTitleIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for header start
        if (line.startsWith('#### ')) {
            currentBlockTitleIndex = newLines.length; // Mark where the title line is in the new array
            newLines.push(line); // Push matches for now, we might update it later if we find the image
            currentUpdateMatchedProduct = null;
            continue;
        }

        // Check for Image
        const imgMatch = line.match(/\!\[.*?\]\((.*?)\)/);
        if (imgMatch && currentBlockTitleIndex !== -1) {
            const imgUrl = imgMatch[1].trim();
            const product = productByImage.get(imgUrl);

            if (product) {
                currentUpdateMatchedProduct = product;
                console.log(`✅ Matched image to: "${product.name}"`);

                // Update the Title in the buffer (currentBlockTitleIndex)
                // The original line was "#### Old Title"
                // We replace it with "#### New Title"
                newLines[currentBlockTitleIndex] = `#### ${product.name}`;
            } else {
                console.warn(`⚠️ No match found for image: ${imgUrl}`);
            }
            newLines.push(line);
            continue;
        }

        // Check for Price line
        if (currentUpdateMatchedProduct && line.trim().startsWith('- **Website Price**:')) {
            const oldPrice = line;
            const newPrice = `- **Website Price**: $${currentUpdateMatchedProduct.price.toFixed(2)}`;
            if (oldPrice.trim() !== newPrice.trim()) {
                console.log(`   💰 Update Price: ${oldPrice.trim()} -> ${newPrice.trim()}`);
                newLines.push(newPrice);
            } else {
                newLines.push(line);
            }
            continue;
        }

        // Default: keep line
        newLines.push(line);
    }

    // 4. Write back
    fs.writeFileSync(PRODUCT_LINKS_PATH, newLines.join('\n'));
    console.log("💾 Updated product_links.md successfully.");
}

main().catch(console.error);
