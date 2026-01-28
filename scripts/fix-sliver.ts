
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixSliver() {
    const productId = 'a6d7d176-ea9e-4070-b0d1-11cc05ef283d';

    console.log(`Fetching product ${productId}...`);
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    console.log('Current options:', JSON.stringify(product.options, null, 2));

    // Fix Options
    let updatedOptions = product.options;
    let changed = false;

    if (Array.isArray(updatedOptions)) {
        updatedOptions = updatedOptions.map(opt => {
            if (opt.values && Array.isArray(opt.values)) {
                const newValues = opt.values.map((v: string) => {
                    if (v.toLowerCase() === 'sliver') {
                        changed = true;
                        return 'Silver';
                    }
                    return v;
                });
                return { ...opt, values: newValues };
            }
            return opt;
        });
    }

    if (changed) {
        console.log('Updating product options...');
        const { error: updateError } = await supabase
            .from('products')
            .update({ options: updatedOptions })
            .eq('id', productId);

        if (updateError) console.error('Error updating product:', updateError);
        else console.log('Product options updated successfully.');
    } else {
        console.log('No "sliver" found in product options to fix.');
    }

    // Check Variants Column in 'products' table
    let updatedVariants = product.variants;
    let variantsChanged = false;

    if (Array.isArray(updatedVariants)) {
        updatedVariants = updatedVariants.map((v: any) => {
            let vModified = false;
            let vOptions = v.options;

            if (vOptions && typeof vOptions === 'object') {
                for (const key in vOptions) {
                    if (vOptions[key] === 'Sliver' || vOptions[key] === 'sliver') {
                        vOptions[key] = 'Silver';
                        vModified = true;
                    }
                }
            }

            // Also check variant name if it exists inside the variant object
            if (v.name && v.name.toLowerCase().includes('sliver')) {
                v.name = v.name.replace(/sliver/gi, 'Silver');
                vModified = true;
            }

            if (vModified) {
                variantsChanged = true;
                return { ...v, options: vOptions }; // name is also mutated in v
            }
            return v;
        });
    }

    if (variantsChanged) {
        console.log('Updating product variants column...');
        const { error: updateVarError } = await supabase
            .from('products')
            .update({ variants: updatedVariants })
            .eq('id', productId);

        if (updateVarError) console.error('Error updating product variants:', updateVarError);
        else console.log('Product variants column updated successfully.');
    } else {
        console.log('No "sliver" found in product variants column.');
    }
}

fixSliver();
