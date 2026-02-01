import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🎿 Adding QKSource Ski Suit...\\n');

    const product = {
        name: 'Winter Ski Suit - Warm Waterproof Fashion',
        description: 'Stay warm and stylish on the slopes with our Premium Winter Ski Suit. Waterproof, windproof, and designed for maximum comfort and flexibility. Features a flattering fit, multiple pockets, and high-quality thermal insulation. Available in Black and White.',
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
        options: {
            Color: ['Black', 'White'],
            Size: ['XS', 'S', 'M', 'L', 'XL']
        }
    };

    try {
        // 1. Create Stripe Product
        console.log('💳 Creating Stripe Product...');
        const stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description,
            images: product.images.slice(0, 8), // Stripe limit
            metadata: {
                supplier: product.supplier,
                cj_product_id: product.cj_product_id,
            },
        });
        console.log(`   ✅ Created Product: ${stripeProduct.id}`);

        // 2. Create Stripe Price
        console.log('💰 Creating Stripe Price...');
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(product.price * 100),
            currency: 'eur',
        });
        console.log(`   ✅ Created Price: ${stripePrice.id}`);

        // Set default price
        await stripe.products.update(stripeProduct.id, {
            default_price: stripePrice.id,
        });

        // 3. Add to Supabase
        console.log('🗄️  Adding to Database...');
        const { data: dbProduct, error: dbError } = await supabase
            .from('products')
            .insert({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                images: product.images, // Supabase stores all images
                supplier: product.supplier,
                cj_product_id: product.cj_product_id,
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id
            })
            .select()
            .single();

        if (dbError) throw dbError;
        console.log(`   ✅ Added product to DB: ${dbProduct.id}`);

        console.log('\\n✨ Product successfully added!');

    } catch (err: any) {
        console.error('❌ Error adding product:', err.message);
    }
}

main().catch(console.error);
