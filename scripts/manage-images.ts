import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEMP_DIR = path.join(process.cwd(), 'temp_images');

async function downloadImage(url: string, filepath: string) {
    const res = await fetch(url);
    if (!res.body) throw new Error(`No body for ${url}`);
    await pipeline(Readable.fromWeb(res.body as any), fs.createWriteStream(filepath));
}

async function main() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }

    // 1. Delete "No Image" Product
    const idToDelete = '0045f0b5-cb0b-448b-80b8-fb679f042709';
    console.log(`Deleting product ${idToDelete}...`);
    const { error: deleteError } = await supabase.from('products').delete().eq('id', idToDelete);
    if (deleteError) console.error('Error deleting:', deleteError);
    else console.log('Deleted product successfully.');

    // 2. Download images for verification
    const productsToFetch = [
        { id: 'a6d7d176-ea9e-4070-b0d1-11cc05ef283d', name: 'earring' },
        { id: '687be2a4-b3e1-4137-a363-df06041768a4', name: 'blue-puffer' },
        { id: '28ce128c-eeca-4d19-956f-db0f9ba35ffc', name: 'brown-puffer' }
    ];

    for (const p of productsToFetch) {
        const { data: prod } = await supabase.from('products').select('images').eq('id', p.id).single();
        if (!prod || !prod.images) {
            console.log(`No images for ${p.name}`);
            continue;
        }

        const productDir = path.join(TEMP_DIR, p.name);
        if (!fs.existsSync(productDir)) fs.mkdirSync(productDir);

        console.log(`Downloading images for ${p.name}...`);
        for (let i = 0; i < prod.images.length; i++) {
            const imgUrl = prod.images[i];
            const filename = `${i}.jpg`;
            try {
                await downloadImage(imgUrl, path.join(productDir, filename));
            } catch (e) {
                console.error(`Failed to download ${imgUrl}:`, e);
            }
        }
    }
    console.log('Done.');
}

main().catch(console.error);
