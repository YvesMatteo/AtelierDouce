
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';

const PRODUCT_ID = '2411190554561614400'; // 3D Effect Patterned Jacket

async function main() {
    const cj = getCJClient();
    console.log(`🔍 Fetching images for ${PRODUCT_ID}...`);

    try {
        const details = await cj.getProductDetails(PRODUCT_ID);
        if (!details) {
            console.error('❌ Product not found.');
            return;
        }

        const imagesSet = new Set<string>();
        if (details.productImage) imagesSet.add(details.productImage);
        if (details.productImageSet) details.productImageSet.forEach((img: string) => imagesSet.add(img));

        details.variants?.forEach((v: any) => {
            if (v.variantImage) imagesSet.add(v.variantImage);
        });

        const allImages = Array.from(imagesSet);
        console.log(`\n📸 Found ${allImages.length} images:\n`);

        allImages.forEach((img, index) => {
            console.log(`[${index}] ${img}`);
        });

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();
