import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_ID = 'cd23a97a-4712-4463-9c1f-8190decd32aa';

const NEW_IMAGES = [
    "https://oss-cf.cjdropshipping.com/product/2025/12/29/08/215ecd8a-6c18-42e0-ae7a-11531bd0c9bc.jpg",
    "https://cf.cjdropshipping.com/quick/product/ff0ce287-e171-4a17-bcd6-31a240c93645.jpg",
    "https://cf.cjdropshipping.com/quick/product/ea345336-cf2a-4442-b2eb-c8316c58b671.jpg",
    "https://cf.cjdropshipping.com/quick/product/43b94fab-99bb-460c-9a59-259a7f608b18.jpg",
    "https://cf.cjdropshipping.com/quick/product/312dbdcf-2e01-401c-a3fb-dda7db468615.jpg",
    "https://cf.cjdropshipping.com/quick/product/e8a20865-eeac-4413-b51b-adac591262ba.jpg",
    "https://cf.cjdropshipping.com/quick/product/c2a92c6f-d3b3-432e-956c-d5e89eb5bd8e.jpg",
    "https://cf.cjdropshipping.com/quick/product/1770bc0d-7df8-47c4-9c6b-afbec84ada00.jpg",
    "https://cf.cjdropshipping.com/quick/product/8d8dfe88-3a23-414d-8b94-e044bc8569ef.jpg"
];

async function updateImages() {
    console.log(`Updating images for product ${PRODUCT_ID}...`);

    const { error } = await supabase
        .from('products')
        .update({ images: NEW_IMAGES })
        .eq('id', PRODUCT_ID);

    if (error) {
        console.error('Error updating product:', error);
    } else {
        console.log('✅ Successfully updated product images!');

        // Verify update
        const { data } = await supabase
            .from('products')
            .select('images')
            .eq('id', PRODUCT_ID)
            .single();

        console.log('Verified images in DB:', data?.images.length);
    }
}

updateImages();
