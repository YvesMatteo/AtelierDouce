import fs from 'fs';
import path from 'path';

const markdownPath = path.join(process.cwd(), 'product_links.md');
const outputPath = path.join(process.cwd(), 'lib/product-url-map.ts');

const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

const regex = /####\s+(.*?)\n[\s\S]*?- \*\*Link to CJ Dropshipping\*\*: \[.*?\]\((.*?)\)\n(?:- \*\*Link to QkSource\*\*: \[.*?\]\((.*?)\))?/g;

// Fallback regex for when Qksource is first or alone, or different format (though file looks consistent)
// Actually the file format seems to be:
// Name
// ...
// Link to CJ
// Link to QkSource (optional)

// Let's use a line-by-line state machine parser for robustness
const lines = markdownContent.split('\n');
const productMap: Record<string, { name: string, cj?: string, qk?: string }> = {};

let currentProductRequest: { name: string, cj?: string, qk?: string } | null = null;

for (const line of lines) {
    const nameMatch = line.match(/^####\s+(.*)/);
    if (nameMatch) {
        if (currentProductRequest) {
            // save previous if valid
            saveProduct(currentProductRequest);
        }
        currentProductRequest = { name: nameMatch[1].trim() };
        continue;
    }

    if (!currentProductRequest) continue;

    const cjMatch = line.match(/- \*\*Link to CJ Dropshipping\*\*: \[.*?\]\((.*?)\)/);
    if (cjMatch) {
        currentProductRequest.cj = cjMatch[1].trim();
    }

    const qkMatch = line.match(/- \*\*Link to QkSource\*\*: \[.*?\]\((.*?)\)/);
    if (qkMatch) {
        currentProductRequest.qk = qkMatch[1].trim();
    }
}
// Save last one
if (currentProductRequest) {
    saveProduct(currentProductRequest);
}

function saveProduct(p: { name: string, cj?: string, qk?: string }) {
    // Extract ID from CJ URL if possible
    // CJ pattern: id=2000862978889248769 or similar
    let id: string | null = null;

    if (p.cj) {
        const idMatch = p.cj.match(/[?&]id=([^&]+)/);
        if (idMatch) id = idMatch[1];
    }

    // If no CJ ID, try QkSource ID
    // QkSource pattern: ...-p-2000862978889248769.html
    if (!id && p.qk) {
        const idMatch = p.qk.match(/-p-([^.]+)\.html/);
        if (idMatch) id = idMatch[1];
    }

    // Some products only have QkSource and maybe link format is different?
    // Let's check the file content again.
    // Example: https://cjdropshipping.com/product-detail.html?id=...
    // Example: https://qksource.com/product/...-p-....html

    if (id) {
        productMap[id] = p;
    } else {
        console.warn(`Could not extract ID for product: ${p.name}`);
        // Maybe log links to debug
        console.log('CJ:', p.cj);
        console.log('QK:', p.qk);
    }
}

const fileContent = `// Auto-generated from product_links.md
export const PRODUCT_URL_MAP: Record<string, { name: string, cj?: string, qk?: string }> = ${JSON.stringify(productMap, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent);

console.log(`Generated map with ${Object.keys(productMap).length} products at ${outputPath}`);
