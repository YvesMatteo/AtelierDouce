
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateImages() {
    const productName = "Winter Coat Warm Lapel Long Fluffy Faux Fur Coat";
    console.log(`🔍 Searching for product: "${productName}"...`);

    const { data: products, error: searchError } = await supabase
        .from('products')
        .select('id, name, images')
        .ilike('name', productName);

    if (searchError) {
        console.error('❌ Error searching for product:', searchError);
        return;
    }

    if (!products || products.length === 0) {
        console.error('❌ Product not found.');
        return;
    }

    const product = products[0];
    console.log(`✅ Found product: ${product.name} (${product.id})`);
    console.log('📸 Current images count:', product.images?.length);

    if (!product.images || product.images.length < 3) {
        console.warn('⚠️ Product has fewer than 3 images. Cannot proceed with specific swap logic.');
        console.log('Current images:', product.images);
        return;
    }

    const originalImages = [...product.images];

    // Logic: 
    // 1. Get rid of the first picture (index 0)
    // 2. Use the third picture (index 2) as the big main picture (new index 0)

    // Original indices: [0, 1, 2, 3, ...]
    // We want to remove 0.
    // We want 2 to become the new 0.

    // Let's grab index 2.
    const newMainImage = originalImages[2];

    // Filter out index 0 (remove it).
    // Note: If we remove index 0 first, indices shift. 
    // Let's just build a new array.

    // "Get rid of this first picture completely" -> Remove original[0]
    // "Use the third picture as the big main picture" -> This implies reordering? 
    // If we remove original[0], original[1] becomes new[0], original[2] becomes new[1].
    // The user says "use the third picture as the big main picture".
    // This likely means: Take original[2], put it at the front. And remove original[0].

    // Step 1: Remove original[0].
    // Remaining: [original[1], original[2], original[3]...]

    // Step 2: From the remaining, which was original[2]? It's now at index 1.
    // Wait, let's be precise.
    // Original: [A, B, C, D...]
    // User wants: Remove A. Use C as main.
    // Result should start with C.
    // What happens to B? Presumably it stays.
    // So: [C, B, D, ...] ? 
    // Or maybe user just wants C to be first. 
    // "Use the third picture as the big main picture"

    // Let's assume:
    // 1. Identify C (original[2]).
    // 2. Remove A (original[0]).
    // 3. Place C at the front.
    // 4. Keep others (B, D...) in relative order?

    // Let's try: New List = [original[2], original[1], original[3], original[4]...]

    const imageToPromote = originalImages[2];
    const otherImages = originalImages.filter((_, index) => index !== 0 && index !== 2);

    // Wait, if I do [original[2], original[1], ...others], is that right?
    // If I just remove 0: [B, C, D]
    // Then move C to front: [C, B, D]

    const newImages = [imageToPromote, originalImages[1], ...product.images.slice(3)];

    // Let's double check boundaries.
    // If length is exactly 3: [A, B, C]
    // Remove A -> [B, C]
    // Promote C -> [C, B]
    // My code: [C, B, ...slice(3) is empty] -> [C, B]. Correct.

    console.log('🔄 Updating images...');
    console.log('Old main:', originalImages[0]);
    console.log('New main:', newImages[0]);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);

    if (updateError) {
        console.error('❌ Failed to update images:', updateError);
    } else {
        console.log('✅ Successfully updated images!');
    }
}

updateImages();
