
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import fs from 'fs';
import path from 'path';

const QKSOURCE_URLS = [
    'https://qksource.com/product/detachable-hooded-zip-up-cotton-coat-p-2511300843381609000.html',
    'https://qksource.com/product/down-jacket-ag1-1105-p-2000862978889248769.html',
    'https://qksource.com/product/autumn-western-pleated-short-single-womens-pile-style-boots-p-2511050858251614900.html',
    'https://qksource.com/product/fashionable-and-versatile-fleece-lined-thick-flat-warm-womens-ankle-boots-p-2511150813301617800.html',
    'https://qksource.com/product/womens-short-tube-snow-boots-with-latex-insoles-p-2512050318251608500.html',
    'https://qksource.com/product/womens-stylish-suede-stiletto-pointed-boots-p-2601140940251636900.html',
    'https://qksource.com/product/chessboard-plaid-knitted-hat-for-women-p-1735282529143365632.html',
    'https://qksource.com/product/fashion-individual-casual-cotton-slippers-women-p-2511010923041613300.html',
    'https://qksource.com/product/fashion-plaid-scarf-for-women-p-1760130972168761344.html',
    'https://qksource.com/product/winter-coat-warm-lapel-long-fluffy-faux-fur-coat-women-loose-long-sleeve-jacket-outerwear-clothing-p-2501070601131628700.html',
    'https://qksource.com/product/large-sized-cotton-slippers-for-women-autumn-and-winter-couples-style-p-2512110858151626600.html',
    'https://qksource.com/product/womens-fashionable-platform-snow-boots-p-2512240513531625200.html'
];

function extractId(url: string): string | null {
    const match = url.match(/p-(\d+)\.html/);
    return match ? match[1] : null;
}

async function generateReview() {
    console.log('Generating QKSource image review artifact...');
    const cj = getCJClient();
    let markdown = '# QKSource Product Image Review\n\nPlease review the available images for each product. Note down the **Image Index** of the ones you want to KEEP or DELETE. Also note strict order if needed.\n\n';

    for (const [index, url] of QKSOURCE_URLS.entries()) {
        const id = extractId(url);
        if (!id) {
            console.error(`Could not extract ID from ${url}`);
            markdown += `## Product ${index + 1}\n*Error: Could not extract ID from URL: ${url}*\n\n---\n\n`;
            continue;
        }

        try {
            // Rate limit
            if (index > 0) await new Promise(r => setTimeout(r, 1500));
            console.log(`Processing [${index + 1}/${QKSOURCE_URLS.length}] ID: ${id}...`);

            const details = await cj.getProductDetails(id);
            if (!details) {
                markdown += `## Product ${index + 1} (${id})\n*Error: Product not found in CJ*\n\n---\n\n`;
                continue;
            }

            const name = details.productNameEn || details.productName;

            // Collect images
            let imgs: string[] = [];
            if (Array.isArray(details.productImage)) imgs = details.productImage;
            else if (typeof details.productImage === 'string') imgs = [details.productImage];
            if (details.productImageSet) imgs = [...imgs, ...details.productImageSet];

            // Unique and valid
            imgs = Array.from(new Set(imgs)).filter(u => u && typeof u === 'string');

            markdown += `## ${name}\n**CJ ID**: \`${id}\`\n**Source**: [QKSource Link](${url})\n\n`;
            markdown += `| Index | Image |\n| :---: | --- |\n`;

            imgs.forEach((url, i) => {
                markdown += `| **${i + 1}** | <img src="${url}" width="200" /> |\n`;
            });
            markdown += `\n---\n\n`;

        } catch (e: any) {
            console.error(`Error fetching ${id}: ${e.message}`);
            markdown += `## Product ${index + 1} (${id})\n*Error fetching images: ${e.message}*\n\n---\n\n`;
        }
    }

    const artifactPath = path.join(process.cwd(), 'qksource_images.md');
    fs.writeFileSync(artifactPath, markdown);
    console.log(`Artifact saved to ${artifactPath}`);
}

generateReview().catch(console.error);
