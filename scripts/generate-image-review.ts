
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import fs from 'fs';
import path from 'path';

// Products to fetch (copy from add-bulk-products.ts)
const PRODUCTS_TO_ADD = [
    { id: '1626869424990990336', name: 'High Grade Short Autumn Coat' },
    { id: '1381486068892831744', name: 'Minimalist Hoop Circle Earrings' },
    { id: '1578244934304542720', name: 'Simple Pearl Single Layer Necklace' },
    { id: '516732AB-1D5F-49F7-BE3F-17BD08B6945A', name: 'Star and Diamond Tag Bracelet' },
    { id: '1550458464835743744', name: 'Warm Casual Knitted Octagonal Hat' },
    { id: '1749986964654272512', name: 'Thickened Warm Wool Socks' },
    { id: '7FE80359-83EB-412E-BB50-F8C4DB86E1AA', name: 'Warm Hooded Jacket' },
    { id: '2411190554561614400', name: 'Casual Hooded Cotton Puffer Jacket' },
    { id: '2512020833381633000', name: 'Thick Puffer Warm Cotton Coat' },
    { id: '2508241410251629900', name: 'Gray Woolen Padded Shoulder Jacket' },
    { id: '1746094682741936128', name: 'Niche Plaid Cloud Bag' },
    { id: '1672132490384904192', name: 'Simple Pocket Coin Purse' },
    { id: '1405411242029486080', name: 'Casual Shoulder Tote Bag' },
    { id: '1544965318324531200', name: 'Lapel Single Breasted Knit Cardigan' },
];

async function generateReview() {
    console.log('Generating image review artifact...');
    const cj = getCJClient();
    let markdown = '# Product Image Review\n\nPlease review the available images for each product. Note down the **Image Index** of the ones you want to KEEP or DELETE.\n\n';

    for (const [index, item] of PRODUCTS_TO_ADD.entries()) {
        try {
            console.log(`Processing ${item.name}...`);
            // Rate limit
            if (index > 0) await new Promise(r => setTimeout(r, 1000));

            const details = await cj.getProductDetails(item.id);
            if (!details) continue;

            let imgs: string[] = [];
            if (Array.isArray(details.productImage)) imgs = details.productImage;
            else if (typeof details.productImage === 'string') imgs = [details.productImage];
            if (details.productImageSet) imgs = [...imgs, ...details.productImageSet];

            // Unique
            imgs = Array.from(new Set(imgs)).filter(url => url && typeof url === 'string');

            markdown += `## ${item.name}\n**CJ ID**: \`${item.id}\`\n\n`;
            markdown += `| Index | Image |\n| :---: | --- |\n`;

            imgs.forEach((url, i) => {
                markdown += `| **${i + 1}** | <img src="${url}" width="200" /> |\n`;
            });
            markdown += `\n---\n\n`;

        } catch (e: any) {
            console.error(`Error fetching ${item.name}: ${e.message}`);
            markdown += `## ${item.name}\n*Error fetching images: ${e.message}*\n\n---\n\n`;
        }
    }

    const artifactPath = path.join(process.cwd(), 'product_images.md');
    fs.writeFileSync(artifactPath, markdown);
    console.log(`Artifact saved to ${artifactPath}`);
}

generateReview().catch(console.error);
