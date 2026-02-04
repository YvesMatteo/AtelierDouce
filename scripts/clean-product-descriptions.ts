// Script to clean spam text from product descriptions
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDescriptions() {
    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products to check\n`);

    for (const product of products) {
        if (!product.description) continue;

        let cleanedDescription = product.description;

        // Remove spam patterns like "• Pattern: ... • Gender: Women" etc
        // These patterns typically start with "• Pattern:" or just contain lots of bullet point specs

        // Pattern 1: Remove everything from "• Pattern:" to the end of that spam block
        cleanedDescription = cleanedDescription.replace(/•\s*Pattern:.*?(?=•\s*(Premium|Designed|Durable|$))/gs, '');

        // Pattern 2: Remove lines with "• Colors:" followed by lots of color specs
        cleanedDescription = cleanedDescription.replace(/•\s*Colors?:.*?(?=•\s*(Premium|Designed|Durable|$))/gs, '');

        // Pattern 3: Remove "• Heel height:" specs
        cleanedDescription = cleanedDescription.replace(/•\s*Heel height:.*?(?=•)/gs, '');

        // Pattern 4: Remove "• Sizes:" with all the fits info
        cleanedDescription = cleanedDescription.replace(/•\s*Sizes?:.*?(?=•\s*(Premium|Designed|Durable|Upper|$))/gs, '');

        // Pattern 5: Remove "• Upper:" specs
        cleanedDescription = cleanedDescription.replace(/•\s*Upper:.*?(?=•)/gs, '');

        // Pattern 6: Remove "• Gender:" specs
        cleanedDescription = cleanedDescription.replace(/•\s*Gender:.*?(?=•|$)/gs, '');

        // Pattern 7: Remove "• Material:" long specs
        cleanedDescription = cleanedDescription.replace(/•\s*Material:.*?(?=•\s*(Premium|Designed|Durable|$))/gs, '');

        // Pattern 8: Remove "• Style:" specs  
        cleanedDescription = cleanedDescription.replace(/•\s*Style:.*?(?=•)/gs, '');

        // Pattern 9: Remove "• Applicable:" specs
        cleanedDescription = cleanedDescription.replace(/•\s*Applicable.*?(?=•)/gs, '');

        // Clean up multiple bullet points and whitespace
        cleanedDescription = cleanedDescription.replace(/•\s*•/g, '•');
        cleanedDescription = cleanedDescription.replace(/\n\s*\n\s*\n/g, '\n\n');
        cleanedDescription = cleanedDescription.trim();

        if (cleanedDescription !== product.description) {
            console.log(`Cleaning: ${product.name}`);
            console.log(`  Before length: ${product.description.length}`);
            console.log(`  After length: ${cleanedDescription.length}`);

            const { error: updateError } = await supabase
                .from('products')
                .update({ description: cleanedDescription })
                .eq('id', product.id);

            if (updateError) {
                console.error(`  Error updating ${product.name}:`, updateError);
            } else {
                console.log(`  ✅ Updated`);
            }
        }
    }

    console.log('\n✅ Done cleaning product descriptions!');
}

cleanDescriptions().catch(console.error);
