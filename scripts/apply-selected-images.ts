
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const UPDATES = [
    {
        // One: High Grade Short Autumn Coat
        id: '1626869424990990336',
        indexes: [0, 3, 4, 5, 6]
    },
    {
        // Two: Minimalist Hoop Circle Earrings
        id: '1381486068892831744',
        indexes: [0, 1, 2, 4]
    },
    {
        // Three: Simple Pearl Single Layer Necklace
        id: '1578244934304542720',
        indexes: [0, 7]
    },
    {
        // Four: Star and Diamond Tag Bracelet
        id: '516732AB-1D5F-49F7-BE3F-17BD08B6945A',
        indexes: [0, 1, 2, 3, 4]
    },
    // Five: DELETE (Handled in code)
    {
        // Six: Thickened Warm Wool Socks
        id: '1749986964654272512',
        indexes: [0, 2, 1, 3]
    },
    {
        // Seven: Warm Hooded Jacket
        id: '7FE80359-83EB-412E-BB50-F8C4DB86E1AA',
        indexes: [0, 3, 1], // 4th image (index 5) handled manually
        customImage: 'https://atelierdouce.shop/product-images/warm-hooded-jacket-white-bg.png'
    },
    {
        // Eight: Casual Hooded Cotton Puffer Jacket
        id: '2411190554561614400',
        indexes: [1, 2, 3, 4]
    },
    {
        // Nine: Thick Puffer Warm Cotton Coat
        id: '2512020833381633000',
        indexes: [0, 1, 2, 3, 5]
    },
    {
        // Ten: Gray Woolen Padded Shoulder Jacket
        id: '2508241410251629900',
        indexes: [1, 0, 2, 3, 4]
    },
    {
        // Eleven: Niche Plaid Cloud Bag
        id: '1746094682741936128',
        indexes: [0, 2, 1]
    },
    {
        // Twelve: Simple Pocket Coin Purse
        id: '1672132490384904192',
        indexes: [0, 1]
    },
    {
        // Thirteen: Casual Shoulder Tote Bag
        id: '1405411242029486080',
        indexes: [0, 1, 2, 3, 4, 5, 6]
    },
    {
        // Fourteen: Lapel Single Breasted Knit Cardigan
        id: '1544965318324531200',
        indexes: [0, 2, 1, 3] // Updated to include 4
    }
];

// Map of IDs to their full image lists (copied from manual verification or we can fetch them)
// Since the user agreed to the indexes from the artifact, we should ideally fetch the current full list from CJ again 
// OR scrape them from the artifact source. 
// For reliability, I will re-fetch the full list from CJ in this script and then apply the indexes.
import { getCJClient } from '../lib/cjdropshipping';

async function run() {
    console.log('Applying image updates...');
    const cj = getCJClient();

    // 1. Delete the product
    const deleteId = '1550458464835743744';
    const { error: delError } = await supabase.from('products').delete().eq('cj_product_id', deleteId);
    if (!delError) console.log(`✅ Deleted product ${deleteId}`);
    else console.error(`❌ Error deleting ${deleteId}:`, delError);

    // 2. Update images
    for (const item of UPDATES) {
        try {
            console.log(`Updating ${item.id}...`);
            // Rate limit
            await new Promise(r => setTimeout(r, 1500));

            const details = await cj.getProductDetails(item.id);
            if (!details) {
                console.error(`Could not fetch details for ${item.id}`);
                continue;
            }

            let allImgs: string[] = [];
            if (Array.isArray(details.productImage)) allImgs = details.productImage;
            else if (typeof details.productImage === 'string') allImgs = [details.productImage];
            if (details.productImageSet) allImgs = [...allImgs, ...details.productImageSet];

            // Deduplicate same as before
            allImgs = Array.from(new Set(allImgs)).filter(url => url && typeof url === 'string');

            // Select keys
            // @ts-ignore
            let selectedImgs = item.indexes.map(idx => allImgs[idx]).filter(Boolean);

            // @ts-ignore
            if (item.customImage) {
                // @ts-ignore
                selectedImgs.push(item.customImage);
            }

            if (selectedImgs.length === 0) {
                console.warn(`No images selected for ${item.id}, skipping update.`);
                continue;
            }

            const { error } = await supabase
                .from('products')
                .update({ images: selectedImgs })
                .eq('cj_product_id', item.id);

            if (error) console.error(`Error updating ${item.id}:`, error);
            else console.log(`✅ Updated ${selectedImgs.length} images for ${item.id}`);

        } catch (e) {
            console.error(e);
        }
    }
}

run();
