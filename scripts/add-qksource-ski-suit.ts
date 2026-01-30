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
    console.log('🎿 Adding QKSource Ski Suit...\n');

    const product = {
        name: 'Premium Winter Ski Suit',
        description: 'Stay warm and stylish on the slopes with our Premium Winter Ski Suit. Waterproof, windproof, and designed for maximum comfort and flexibility. Features a flattering fit, multiple pockets, and high-quality thermal insulation.',
        price: 99,
        category: 'Tops & Bottoms',
        supplier: 'Qksource',
        cj_product_id: '1745817525838946304',
        images: [
            // Main image (Black)
            'https://cf.cjdropshipping.com/quick/product/531385c1-1649-4428-b59a-d3bc16ce2e7e.jpg',
            // White
            'https://cf.cjdropshipping.com/quick/product/c3f4d32f-cfee-4130-9968-8293ab511d07.jpg',
            // Gallery
            'https://cf.cjdropshipping.com/quick/product/f96fd381-3fd5-498e-9aea-90da5990e661.jpg',
            'https://cf.cjdropshipping.com/quick/product/69b5a754-ea12-495c-8032-8f858a85e463.jpg',
            'https://cf.cjdropshipping.com/quick/product/95d0f31f-541f-4189-ad9e-907dc24e6ac7.jpg',
            'https://cf.cjdropshipping.com/quick/product/2ca43b36-fbfc-4ae0-add2-19daa8594f40.jpg',
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
                stripe_price_id: stripePrice.id,
                product_options: product.options // Store variants directly
            })
            .select()
            .single();

        if (dbError) throw dbError;
        console.log(`   ✅ Added product to DB: ${dbProduct.id}`);

        // 4. Create Variant Specifics (Optional, but good for tracking)
        // Note: For now we're storing options in the main product JSON, 
        // but if we were using a separate variants table we'd populate it here.
        // The current schema just uses `product_options` JSONB column.

        console.log('\n✨ Product successfully added!');

    } catch (err: any) {
        console.error('❌ Error adding product:', err.message);
    }
}

main().catch(console.error);
