
import fs from 'fs';
import path from 'path';

const INPUT_PATH = path.join(process.cwd(), 'product_pricing_analysis.md');
const OUTPUT_PATH = path.join(process.cwd(), 'whatsapp_pricing_report.txt');

function main() {
    if (!fs.existsSync(INPUT_PATH)) {
        console.error("Input file not found!");
        return;
    }

    const content = fs.readFileSync(INPUT_PATH, 'utf-8');
    const lines = content.split('\n');
    let output = "📋 *Product Pricing Report* 📋\n\n";

    let count = 0;
    for (const line of lines) {
        if (!line.startsWith('| <img')) {
            // Now we check for index number or img tag since column 1 is index
            // Line starts with | index | <img ...
            // So line starts with | 1 | ...
            // We can just rely on splitting by |
            // Let's iterate and check columns
            // Or safer: check if it contains <img
            if (!line.includes('<img')) continue;
        }

        // Parse columns
        // | # | Image | Name | Sell | Cost | Margin | Link |
        // parts[0] is empty
        // parts[1] is Index
        // parts[2] is Image
        // parts[3] is Name
        // parts[4] is Sell
        // parts[5] is Cost
        // parts[6] is Margin
        // parts[7] is Link

        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 8) continue;

        const index = parts[1];
        const name = parts[3].replace(/\*\*/g, ''); // Remove bold markdown
        const sellPrice = parts[4];
        const costPrice = parts[5];
        const margin = parts[6];
        let link = parts[7];

        // Extract URL from markdown link [Link](url)
        const linkMatch = link.match(/\((.*?)\)/);
        if (linkMatch) {
            link = linkMatch[1];
        } else if (link === '-') {
            link = 'No Link';
        }

        output += `📦 *#${index} ${name}*\n`;
        output += `💰 Sell: ${sellPrice} | Cost: ${costPrice}\n`;
        output += `📈 Margin: ${margin}\n`;
        output += `🔗 ${link}\n`;
        output += `--------------------------------\n`;
        count++;
    }

    fs.writeFileSync(OUTPUT_PATH, output);
    console.log(`✅ Generated WhatsApp report with ${count} products at: ${OUTPUT_PATH}`);
}

main();
