
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Dark Brown Velboa Boots
const TARGET_ID = '2511280758221607400';

async function main() {
    console.log(`🗑️  Deleting product ${TARGET_ID} (Dark Brown Velboa Boots)...`);

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('cj_product_id', TARGET_ID);

    if (error) {
        console.error("❌ Error deleting product:", error.message);
    } else {
        console.log("✅ Successfully deleted product!");
    }
}

main();
