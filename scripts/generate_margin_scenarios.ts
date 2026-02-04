
import fs from 'fs';
import path from 'path';

const REPORT_PATH = 'product_pricing_analysis.md';
const OUTPUT_PATH = 'margin_scenarios.md';

// Fallback prices for products with missing data
const FALLBACK_PRICES: Record<number, number> = {
    1: 17.00, // Estimate for Winter Outdoor body hoodie ($99 sell)
    3: 280.00 // From script placeholder for Pro Ski Suit ($399 sell)
};

interface Product {
    index: number;
    name: string;
    sellPrice: number;
    supplierCost: number;
    isEstimate: boolean;
}

function parsePrice(priceStr: string): number {
    // Remove $, commas, whitespace
    const clean = priceStr.replace(/[$, ]/g, '').trim();

    // Handle ranges: "5.64 - 8.06" -> take MAX for conservative cost, MIN for sell? 
    // Usually sell price is single. Supplier cost might be range.
    // For Supplier Cost: Take MAX.
    if (clean.includes('-')) {
        const parts = clean.split('-').map(p => parseFloat(p));
        return Math.max(...parts);
    }

    return parseFloat(clean);
}

function main() {
    const content = fs.readFileSync(REPORT_PATH, 'utf-8');
    const lines = content.split('\n');
    const products: Product[] = [];

    // Skip header lines (approx first 6 lines based on recent view)
    // Find table start
    let inTable = false;

    for (const line of lines) {
        if (line.trim().startsWith('| ---') || line.trim().startsWith('| :--')) {
            inTable = true;
            continue;
        }
        if (!inTable) continue;
        if (!line.trim().startsWith('|')) continue;

        const cols = line.split('|').map(c => c.trim());
        // | # | Image | Name | Sell | Cost | Margin | Link |
        // cols[0] is empty string (before first |)
        // cols[1] is Index
        // cols[2] is Image
        // cols[3] is Name
        // cols[4] is Sell Price
        // cols[5] is Supplier Cost

        if (cols.length < 7) continue;

        const index = parseInt(cols[1]);
        if (isNaN(index)) continue;

        const name = cols[3].replace(/\*\*/g, ''); // Remove bold
        const sellRaw = cols[4];
        const costRaw = cols[5];

        let sellPrice = parsePrice(sellRaw);
        let supplierCost = 0;
        let isEstimate = false;

        if (costRaw.includes('N/A') || costRaw.includes('Error')) {
            if (FALLBACK_PRICES[index]) {
                supplierCost = FALLBACK_PRICES[index];
                isEstimate = true;
            } else {
                console.warn(`Skipping product #${index} (${name}) due to missing cost and no fallback.`);
                continue;
            }
        } else {
            supplierCost = parsePrice(costRaw);
        }

        products.push({ index, name, sellPrice, supplierCost, isEstimate });
    }

    console.log(`Parsed ${products.length} products.`);

    let output = `# Margin Analysis Scenarios\n\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n\n`;
    output += `**Scenarios:**\n`;
    output += `1. **Buy 4 Get 1 Free**: Customer gets 5 items, pays for 4. Total Cost = 5 * Supplier Cost.\n`;
    output += `2. **Buy 2 Get 15% Off**: Customer gets 2 items. Revenue = 2 * Sell * 0.85. Total Cost = 2 * Supplier Cost.\n\n`;

    output += `| # | Product Name | Unit Sell | Unit Cost | **B4G1 Revenue** | **B4G1 Cost** | **B4G1 Margin** | **B4G1 %** | **B2-15% Revenue** | **B2-15% Cost** | **B2-15% Margin** | **B2-15% %** |\n`;
    output += `| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const p of products) {
        // Scenario 1: Buy 4 Get 1 Free (5 items total)
        // Revenue is from 4 items
        const b4g1_revenue = 4 * p.sellPrice;
        // Cost is for 5 items
        const b4g1_cost = 5 * p.supplierCost;
        const b4g1_margin = b4g1_revenue - b4g1_cost;
        const b4g1_percent = (b4g1_margin / b4g1_revenue) * 100;

        // Scenario 2: Buy 2 Get 15% Off (2 items)
        // Revenue is 2 items * 0.85
        const b2_revenue = 2 * p.sellPrice * 0.85;
        const b2_cost = 2 * p.supplierCost;
        const b2_margin = b2_revenue - b2_cost;
        const b2_percent = (b2_margin / b2_revenue) * 100;

        const costDisplay = p.isEstimate ? `$${p.supplierCost.toFixed(2)}*` : `$${p.supplierCost.toFixed(2)}`;

        output += `| ${p.index} | ${p.name} | $${p.sellPrice.toFixed(2)} | ${costDisplay} | `;
        output += `$${b4g1_revenue.toFixed(2)} | $${b4g1_cost.toFixed(2)} | **$${b4g1_margin.toFixed(2)}** | ${b4g1_percent.toFixed(1)}% | `;
        output += `$${b2_revenue.toFixed(2)} | $${b2_cost.toFixed(2)} | **$${b2_margin.toFixed(2)}** | ${b2_percent.toFixed(1)}% |\n`;
    }

    output += `\n*\\* Indicates estimated supplier cost used for calculation due to missing data.*\n`;

    fs.writeFileSync(OUTPUT_PATH, output);
    console.log(`✅ Report generated at ${OUTPUT_PATH}`);
}

main();
