
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getCJClient } from '../lib/cjdropshipping';

if (!process.env.CJ_ACCESS_TOKEN) {
    console.error('❌ CJ_ACCESS_TOKEN is missing in environment variables');
    process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials missing (need URL and ANON_KEY)');
    // process.exit(1); // Continue to check CJ at least
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    console.log('🔍 Verifying Dropshipping Automation Setup...\n');

    // 1. Test CJ Connection
    console.log('1️⃣ Testing CJ Dropshipping API Connection...');
    try {
        const cj = getCJClient();
        // Trying a simple search to verify token validity
        const searchResult = await cj.searchProducts({ size: 1 });
        if (searchResult) {
            console.log('   ✅ CJ API Connection Successful');
        } else {
            console.error('   ❌ CJ API returned no result (but no error)');
        }
    } catch (error: any) {
        console.error('   ❌ CJ API Connection Failed:', error.message);
    }

    // 2. Check Products for CJ IDs
    console.log('\n2️⃣ Checking Products for CJ Mapping...');
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, cj_product_id, stripe_product_id')
            .limit(10);

        if (error) throw error;

        console.log(`   Found ${products.length} products to check.`);
        let mappedCount = 0;
        products.forEach(p => {
            const isMapped = !!p.cj_product_id;
            if (isMapped) mappedCount++;
            console.log(`   - [${isMapped ? 'OK' : 'MISSING CJ ID'}] ${p.name.substring(0, 30)}... (CJ ID: ${p.cj_product_id || 'null'})`);
        });

        if (mappedCount === products.length) {
            console.log('   ✅ All sample products have CJ IDs');
        } else {
            console.log(`   ⚠️ Only ${mappedCount}/${products.length} products have CJ IDs. Automation will fail for unmapped products.`);
        }

    } catch (error: any) {
        console.error('   ❌ DB Check Failed:', error.message);
    }

    // 3. Check recent orders
    console.log('\n3️⃣ Checking Recent Orders...');
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, status, cj_order_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (orders.length === 0) {
            console.log('   ℹ️ No orders found in database.');
        } else {
            orders.forEach(o => {
                console.log(`   - Order ${o.id.substring(0, 8)}: Status=${o.status}, CJ Order ID=${o.cj_order_id || 'Has not been processed'}`);
            });
        }

    } catch (error: any) {
        console.error('   ❌ Order Check Failed:', error.message);
    }
}

verify().catch(console.error);
