import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BROWN_PUFFER_ID = '28ce128c-eeca-4d19-956f-db0f9ba35ffc';
const BLUE_PUFFER_ID = '687be2a4-b3e1-4137-a363-df06041768a4';
const EARRING_ID = 'a6d7d176-ea9e-4070-b0d1-11cc05ef283d';
const NEW_IMAGE_PATH = '/Users/yvesromano/.gemini/antigravity/brain/9559ed11-0819-42a0-b384-212c97f05014/brown_puffer_white_1769599614250.png';

async function uploadImage() {
    console.log('Uploading image...');
    const fileContent = fs.readFileSync(NEW_IMAGE_PATH);
    const fileName = `brown-puffer-white-${Date.now()}.png`;

    // Ensure bucket exists (or use 'products' which is common)
    // We'll try to list buckets first to see what's available
    const { data: buckets } = await supabase.storage.listBuckets();
    let bucketName = 'products';
    if (buckets) {
        const productBucket = buckets.find(b => b.name === 'products' || b.name === 'images');
        if (productBucket) bucketName = productBucket.name;
        else {
            // Create if not exists (might fail if no permissions, but we have service role)
            const { data: newBucket, error } = await supabase.storage.createBucket('products', { public: true });
            if (error && !error.message.includes('already exists')) {
                console.error('Error creating bucket:', error);
            }
        }
    }

    console.log(`Using bucket: ${bucketName}`);

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileContent, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    console.log(`Uploaded to: ${publicUrl}`);
    return publicUrl;
}

async function main() {
    // 1. Upload new image for Brown Puffer
    const newImageUrl = await uploadImage();

    // 2. Update Brown Puffer
    console.log('Updating Brown Puffer...');
    const { data: brownPuffer } = await supabase.from('products').select('images').eq('id', BROWN_PUFFER_ID).single();
    if (brownPuffer && brownPuffer.images) {
        const newImages = [...brownPuffer.images];
        newImages[0] = newImageUrl; // Replace first image
        await supabase.from('products').update({ images: newImages }).eq('id', BROWN_PUFFER_ID);
        console.log('Brown Puffer updated.');
    }

    // 3. Update Blue Puffer (Swap 0 and 1)
    console.log('Updating Blue Puffer...');
    const { data: bluePuffer } = await supabase.from('products').select('images').eq('id', BLUE_PUFFER_ID).single();
    if (bluePuffer && bluePuffer.images && bluePuffer.images.length > 2) {
        const newImages = [...bluePuffer.images];
        const temp = newImages[0];
        newImages[0] = newImages[1];
        newImages[1] = temp;
        await supabase.from('products').update({ images: newImages }).eq('id', BLUE_PUFFER_ID);
        console.log('Blue Puffer updated.');
    } else {
        console.log('Blue Puffer has insufficient images to swap.');
    }

    // 4. Update Earring (Remove index 0)
    console.log('Updating Earring...');
    const { data: earring } = await supabase.from('products').select('images').eq('id', EARRING_ID).single();
    if (earring && earring.images && earring.images.length > 0) {
        const newImages = earring.images.slice(1); // Remove first element
        await supabase.from('products').update({ images: newImages }).eq('id', EARRING_ID);
        console.log('Earring updated.');
    } else {
        console.log('Earring has no images to remove.');
    }

    console.log('All updates complete.');
}

main().catch(console.error);
