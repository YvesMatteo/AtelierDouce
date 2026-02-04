
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getCJClient } from '../lib/cjdropshipping';
import fs from 'fs';
import path from 'path';

// Initialize Clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const cj = getCJClient();

// Paths
const PRODUCT_LINKS_PATH = path.join(process.cwd(), 'product_links.md');
const UPDATE_PRICING_REPORT_PATH = path.join(process.cwd(), 'product_pricing_analysis.md');

// Helper to match names if slightly different (stripping non-alphanumeric)
function cleanName(name: string) {
    return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// Helper to parse existing product_links.md for QkSource data
function parseExistingLinks() {
    if (!fs.existsSync(PRODUCT_LINKS_PATH)) return {};

    const content = fs.readFileSync(PRODUCT_LINKS_PATH, 'utf-8');
    const productsByImage: Record<string, any> = {};
    const sections = content.split('#### ');

    for (const section of sections.slice(1)) { // Skip header
        const lines = section.split('\n');

        // Extract Image URL
        const imageLine = lines.find(l => l.includes('Product Thumbnail'));
        let imageUrl = '';
        if (imageLine) {
            const match = imageLine.match(/\((.*?)\)/);
            if (match) imageUrl = match[1];
        }

        const qkLinkLine = lines.find(l => l.includes('Link to QkSource'));
        const supplierPriceLine = lines.find(l => l.includes('Supplier Price'));

        let qkLink = '';
        if (qkLinkLine) {
            const match = qkLinkLine.match(/\((.*?)\)/);
            if (match) qkLink = match[1];
        }

        let supplierPrice = '';
        if (supplierPriceLine) {
            supplierPrice = supplierPriceLine.replace('- **Supplier Price**: ', '').trim();
        }

        if (imageUrl) {
            // Store by full image URL for exact match
            productsByImage[imageUrl.trim()] = { qkLink, supplierPrice };
        }
    }
    return productsByImage;
}


// Fallback prices for products with missing data
const FALLBACK_PRICES: Record<string, number> = {
    'Winter Outdoor Body Hoodie Ski Suit Coat Women': 17.00,
    "Women's New Professional Double-board Waterproof Ski Suit": 280.00
};

function calculateMargin(sellPrice: number, costPrice: number) {
    const margin = sellPrice - costPrice;
    const marginPercent = (margin / sellPrice) * 100;
    return {
        amount: margin.toFixed(2),
        percent: marginPercent.toFixed(0)
    };
}

function calculateCombinedMargin(sellPrice: number, costPrice: number) {
    // Scenario: Buy 4 items
    // 1 item: Free ($0 revenue)
    // 2 items: 15% off (85% revenue)
    // 1 item: Full price (100% revenue)
    // Total Revenue Unit Equivalent = 0 + 0.85 + 0.85 + 1 = 2.7 units

    const totalRevenue = sellPrice * 2.7;
    const totalCost = costPrice * 4;

    const margin = totalRevenue - totalCost;
    const marginPercent = (margin / totalRevenue) * 100;

    return {
        revenue: totalRevenue.toFixed(2),
        cost: totalCost.toFixed(2),
        amount: margin.toFixed(2),
        percent: marginPercent.toFixed(1)
    };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("🚀 Starting Pricing Report Generation...");

    // 1. Fetch DB Products
    const { data: dbProducts, error } = await supabase.from('products').select('*');
    if (error || !dbProducts) {
        console.error("❌ Error fetching products:", error);
        return;
    }
    console.log(`📦 Found ${dbProducts.length} products in database.`);

    // 2. Parse Existing Links for QkSource Backup
    const existingData = parseExistingLinks();

    // 3. Build Report Content
    let reportContent = `# Product Pricing Analysis\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    reportContent += `**Combined Scenario:** Buy 4 items (1 Free, 2 @ 15% Off, 1 Full Price)\n\n`;
    reportContent += `| # | Image | Product Name | Sell Price | Supplier Cost (CJ) | Margin | Combined Margin | QkSource Link |\n`;
    reportContent += `| :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    let index = 1;
    for (const product of dbProducts) {
        process.stdout.write(`Processing: ${product.name}... `);

        // Get CJ Price
        let supplierCost = 'N/A';
        let costValue = 0;
        let note = '';
        let apiSuccess = false;

        if (product.cj_product_id) {
            try {
                // Rate limit: wait 1.5s
                await sleep(1500);

                const details = await cj.getProductDetails(product.cj_product_id);
                if (details && details.variants) {
                    const prices = details.variants.map(v => v.variantSellPrice).filter(p => !isNaN(p));
                    if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        costValue = minPrice;
                        // For calculation, take MAX price if range to be conservative? 
                        // Or just min? User script earlier used MAX. 
                        // Let's settle on MAX for conservative margin calc, but display range.
                        const conservativeCost = maxPrice;
                        costValue = conservativeCost;

                        supplierCost = prices.length > 1 && minPrice !== maxPrice
                            ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
                            : `$${minPrice.toFixed(2)}`;
                        apiSuccess = true;
                        console.log(`✅ $${minPrice} (using Max $${maxPrice} for calc)`);
                    }
                }
            } catch (e: any) {
                console.log(`❌ API Error: ${e.message?.slice(0, 50)}...`);
                note = '(API Error)';
            }
        } else {
            console.log(` (No CJ ID)`);
        }

        // Fallback to existing data if API failed OR no CJ ID
        // Use Image URL for lookup
        const productImage = product.images?.[0] || '';
        const extraData = existingData[productImage.trim()];

        // If API failed or returned nothing useful, try manual price
        if (costValue === 0) {
            // Check hardcoded fallbacks first
            if (FALLBACK_PRICES[product.name]) {
                costValue = FALLBACK_PRICES[product.name];
                supplierCost = `$${costValue.toFixed(2)}`;
                note = '(Est.)';
                console.log(`   Detailed fallback: Using Estimate $${costValue}`);
            } else if (extraData?.supplierPrice) {
                supplierCost = extraData.supplierPrice;
                const matches = supplierCost.match(/(\d+\.?\d*)/);
                if (matches) {
                    costValue = parseFloat(matches[1]);
                    note = '(Manual)';
                    console.log(`   Detailed manual fallback: Using ${costValue} from "${supplierCost}"`);
                }
            }
        }

        // Margin Calc
        let marginDisplay = 'N/A';
        let combinedMarginDisplay = 'N/A';

        if (costValue > 0 && product.price) {
            const m = calculateMargin(product.price, costValue);
            marginDisplay = `$${m.amount} (${m.percent}%)`;

            const cm = calculateCombinedMargin(product.price, costValue);
            combinedMarginDisplay = `**$${cm.amount}** (${cm.percent}%)`;
        }

        // QkSource Link & Image
        const qkLink = extraData?.qkLink ? `[Link](${extraData.qkLink})` : '-';

        let imageSrc = product.images?.[0] || '';
        if (imageSrc.startsWith('/')) {
            // Resolve local public path to absolute path for Artifact viewer
            imageSrc = `${process.cwd()}/public${imageSrc}`;
        }

        const image = imageSrc ? `<img src="${imageSrc}" width="100"/>` : 'No Image';

        // Add to Table
        reportContent += `| ${index} | ${image} | **${product.name}** | $${product.price} | ${supplierCost} ${note} | ${marginDisplay} | ${combinedMarginDisplay} | ${qkLink} |\n`;
        index++;
    }

    // 4. Write Report
    fs.writeFileSync(UPDATE_PRICING_REPORT_PATH, reportContent);
    console.log(`\n✅ Report generated at: ${UPDATE_PRICING_REPORT_PATH}`);
}

main().catch(console.error);

