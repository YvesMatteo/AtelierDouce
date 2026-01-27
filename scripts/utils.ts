export function removeChinese(text: string | null | undefined): string {
    if (!text) return '';
    // 1. Remove Chinese characters in parentheses like "Red (红色)"
    let cleaned = text.replace(/[（\(][\u4e00-\u9fa5|\s/]*[）\)]/g, '');
    // 2. Remove any remaining Chinese characters
    cleaned = cleaned.replace(/[\u4e00-\u9fa5]/g, '');
    // 3. Normalize whitespace
    return cleaned.replace(/\s+/g, ' ').trim();
}

export function cleanProductDescription(html: string | null | undefined): string {
    if (!html) return '';

    // 1. Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');

    // 2. Decode HTML entities (basic common ones)
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // 3. Remove common CJ/AliExpress noise
    text = text.replace(/Origin:\s*CN\(Origin\)/gi, '');
    text = text.replace(/Model Number:[^.]*/gi, '');
    text = text.replace(/Certification:[^.]*/gi, '');
    text = text.replace(/Product information:?/gi, '');
    text = text.replace(/Packing list:?/gi, '');
    text = text.replace(/Product Image:?/gi, '');
    text = text.replace(/Overview:?/gi, '');
    text = text.replace(/Specification:?/gi, '');
    text = text.replace(/Note:?/gi, '');

    // 4. Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // 5. Remove Chinese characters
    text = removeChinese(text);

    // 6. Capitalize first letter
    if (text.length > 0) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return text;
}

export function cleanProductName(name: string): string {
    if (!name) return 'New Product';

    // 1. Handle array-like strings (some CJ products return ["name1", "name2"])
    let processedName = name;
    if (name.startsWith('[') && name.endsWith(']')) {
        try {
            const parsed = JSON.parse(name);
            if (Array.isArray(parsed) && parsed.length > 0) {
                processedName = parsed[0];
            }
        } catch (e) {
            // Not JSON, continue with string cleaning
            processedName = name.replace(/[\[\]"]/g, '');
        }
    }

    // 2. Remove Chinese characters using our utility
    processedName = removeChinese(processedName);

    // 3. Remove non-ASCII characters
    processedName = processedName.replace(/[^\x00-\x7F]/g, ' ');

    // 4. Common e-commerce "junk" keywords to strip
    const junkKeywords = [
        'Amazon', 'Independent Station', 'Hot Selling', 'New', '2024', '2025', 'Cross-border',
        'Explosive', 'Direct Sales', 'Supplier', 'Wholesale', 'Factory', 'In Stock', 'Customizable',
        'Large-sized', 'Small-sized', 'Fashionable', 'Western', 'Versatile', 'English', 'Style',
        'Autumn', 'Winter', 'Spring', 'Summer', 'Niche', 'Design', 'Premium', 'High-grade'
    ];

    const junkRegex = new RegExp(`\\b(${junkKeywords.join('|')})\\b`, 'gi');
    processedName = processedName.replace(junkRegex, '');

    // 5. Normalize and deduplicate words
    const words = processedName
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ');

    const uniqueWords: string[] = [];
    const seen = new Set<string>();

    for (const word of words) {
        const lower = word.toLowerCase();
        // Skip junk words like "Product", "New", "Item" if they are just fillers
        if (lower === 'product' || lower === 'item') continue;

        if (lower && !seen.has(lower) && word.length > 2) { // Increased length to 2
            seen.add(lower);
            // Capitalize first letter
            uniqueWords.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        }
    }

    // 6. Limit length (around 6-8 words is good for UI)
    const result = uniqueWords.slice(0, 8).join(' ');

    // 7. Descriptive Fallback if name is empty (often happens with Chinese-only names)
    if (!result) {
        if (name.toLowerCase().includes('bag') || name.includes('包')) return 'Luxury Fashion Bag';
        if (name.toLowerCase().includes('shoe') || name.toLowerCase().includes('boot') || name.includes('鞋') || name.includes('靴')) return 'Premium Footwear';
        if (name.toLowerCase().includes('coat') || name.toLowerCase().includes('jacket') || name.includes('衣') || name.includes('服')) return 'Stylish Outerwear';
        return 'Elegant Collection Piece';
    }

    return result;
}
