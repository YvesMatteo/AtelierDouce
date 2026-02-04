// Script to standardize product descriptions AND fix shoe sizes
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanProducts() {
    const standardDescription = `• Premium quality materials
• Designed for maximum comfort
• Durable and long-lasting`;

    console.log('Fetching all products...');

    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*');

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
    }

    console.log(`Found ${products.length} products to process.`);

    for (const product of products) {
        let updates: any = {};
        let needsUpdate = false;

        // 1. Standardize description
        if (product.description !== standardDescription) {
            updates.description = standardDescription;
            needsUpdate = true;
        }

        // 2. Fix Shoe Sizes in Options (e.g. "36to37" -> "36-37")
        if (product.options && Array.isArray(product.options)) {
            let newOptions = JSON.parse(JSON.stringify(product.options));
            let optionsChanged = false;

            newOptions = newOptions.map((opt: any) => {
                if (opt.name === 'Size' && Array.isArray(opt.values)) {
                    const newValues = opt.values.map((val: string) => {
                        if (typeof val === 'string' && val.includes('to')) {
                            const newVal = val.replace(/(\d+)to(\d+)/g, '$1-$2');
                            if (newVal !== val) optionsChanged = true;
                            return newVal;
                        }
                        return val;
                    });
                    return { ...opt, values: newValues };
                }
                return opt;
            });

            if (optionsChanged) {
                updates.options = newOptions;
                needsUpdate = true;
            }
        }

        // 3. Fix Shoe Sizes in Variants
        if (product.variants && Array.isArray(product.variants)) {
            let newVariants = JSON.parse(JSON.stringify(product.variants));
            let variantsChanged = false;

            newVariants = newVariants.map((variant: any) => {
                let vChanged = false;
                let newOptions = variant.options || {};

                // Check variant options
                if (newOptions.Size && typeof newOptions.Size === 'string' && newOptions.Size.includes('to')) {
                    newOptions.Size = newOptions.Size.replace(/(\d+)to(\d+)/g, '$1-$2');
                    vChanged = true;
                }

                // Also check if `variantName` or `variantKey` needs update (less critical for display but good for consistency)
                // We mainly care about `options` column as that's what drives the UI selection

                if (vChanged) {
                    variantsChanged = true;
                    return { ...variant, options: newOptions };
                }
                return variant;
            });

            if (variantsChanged) {
                updates.variants = newVariants;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            console.log(`Updating ${product.name}...`);
            if (updates.description) console.log('  - Description updated');
            if (updates.options) console.log('  - Options sizes fixed');
            if (updates.variants) console.log('  - Variants sizes fixed');

            const { error: updateError } = await supabase
                .from('products')
                .update(updates)
                .eq('id', product.id);

            if (updateError) {
                console.error(`  Error updating ${product.name}:`, updateError.message);
            } else {
                console.log(`  ✅ Success`);
            }
        }
    }

    console.log('\n✅ All updates complete!');
}

cleanProducts().catch(console.error);
