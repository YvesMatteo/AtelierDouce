
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // We look for the product with the CJ ID we just restored
    const CJ_ID = '2411190554561614400';
    const NEW_NAME = '3D Effect Patterned Jacket';

    const { error } = await supabase
        .from('products')
        .update({ name: NEW_NAME })
        .eq('cj_product_id', CJ_ID);

    if (error) {
        console.error("❌ Error updating name:", error.message);
    } else {
        console.log(`✅ Updated product with CJ ID ${CJ_ID} to name: "${NEW_NAME}"`);
    }
}

main();
