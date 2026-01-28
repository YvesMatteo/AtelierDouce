
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';

async function debug() {
    const cj = getCJClient();
    const id = '2511300843381609000'; // First product
    console.log(`Fetching details for ${id}...`);
    const details = await cj.getProductDetails(id);
    if (details) {
        console.log('Product Name Type:', typeof details.productName);
        console.log('Product Name Value:', JSON.stringify(details.productName));
        console.log('Name En:', details.productName);
        if (details.variants && details.variants.length > 0) {
            console.log('First Variant:', JSON.stringify(details.variants[0], null, 2));
        }
    }
}

debug().catch(console.error);
