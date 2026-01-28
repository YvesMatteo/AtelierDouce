
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';

async function main() {
    const cj = getCJClient();
    const cjProductId = '2511300843381609000'; // Blue Puffer (Detachable Hooded)

    try {
        const details = await cj.getProductDetails(cjProductId);
        if (!details) {
            console.log('Product not found');
            return;
        }

        console.log('--- Images ---');
        console.log(`Main: ${details.productImage}`);
        details.productImageSet?.forEach((img, i) => console.log(`Set[${i}]: ${img}`));
    } catch (e) {
        console.error(e);
    }
}

main();
