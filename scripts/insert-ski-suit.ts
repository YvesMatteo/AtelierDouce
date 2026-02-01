import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data, error } = await supabase
        .from('products')
        .insert({
            name: 'Winter Ski Suit - Warm Waterproof Fashion',
            description: 'Stay warm and stylish on the slopes with our Premium Winter Ski Suit. Waterproof, windproof, and designed for maximum comfort and flexibility. Available in Black and White.',
            price: 99,
            category: 'Clothing',
            supplier: 'Qksource',
            cj_product_id: '1745817525838946304',
            images: [
                'https://cf.cjdropshipping.com/17051040/2401130230310320400.jpg',
                'https://cf.cjdropshipping.com/17051040/2401130230310320700.jpg',
                'https://cf.cjdropshipping.com/17051040/2401130230310321400.jpg',
                'https://cf.cjdropshipping.com/17051040/2401130230310321900.jpg',
                'https://cf.cjdropshipping.com/17051040/2401130230310322400.jpg',
                'https://cf.cjdropshipping.com/17051040/2401130230310322700.jpg',
            ],
            stripe_product_id: 'prod_TtRyb9Wz391owL',
            stripe_price_id: 'price_1Svf51DcMkrXy2wDjrzgvpJ4'
        })
        .select()
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! Product ID:', data.id);
    }
}

main();
