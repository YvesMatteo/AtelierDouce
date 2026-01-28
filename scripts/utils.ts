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

    // 1. Replace block-level tags with newlines to preserve structure
    let text = html
        .replace(/<(br|p|div|li|tr)[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, ' '); // Strip remaining tags

    // 2. Decode HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // 3. Remove known junk (case-insensitive)
    const junkPatterns = [
        /Origin:\s*CN\(Origin\)/gi,
        /Model Number:[^.]*/gi,
        /Certification:[^.]*/gi,
        /Product information:?/gi,
        /Packing list:?/gi,
        /Product Image:?/gi,
        /Overview:?/gi,
        /Specification:?/gi,
        /Note:?/gi,
        /Brand Name:/gi,
        /Material:/gi, // Often redundant or poorly formatted
        /Size:/gi // Usually better in variants/options, but keep if critical? CJ descriptions are messy.
    ];

    junkPatterns.forEach(pattern => {
        text = text.replace(pattern, ' '); // Replace with space to avoid merging words
    });

    // 4. Split by newlines and process each line
    const lines = text.split('\n');
    const cleanLines: string[] = [];
    const seen = new Set<string>();

    for (let line of lines) {
        // Clean the line
        line = line.replace(/\s+/g, ' ').trim();
        line = removeChinese(line); // Remove Chinese characters

        // Remove leading/trailing punctuation (like dots from removed sentences)
        line = line.replace(/^[\.,\-\s]+|[\.,\-\s]+$/g, '');

        // Collapse internal multiple dots/spaces
        line = line.replace(/\s+/g, ' ').replace(/\s\./g, '.').replace(/\.{2,}/g, '.');

        // Skip empty or very short lines
        if (line.length < 4) continue;

        // Skip lines that are just junk keywords (with optional colon)
        if (/^(feature|features|description|package|include|includes|content|spec|specs|specification|specifications|color|colour|size|material|materials)[:\s]*$/i.test(line)) continue;

        // Skip lines with URLs
        if (line.includes('http')) continue;

        // Check for uniqueness
        const lower = line.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        // Capitalize first letter
        line = line.charAt(0).toUpperCase() + line.slice(1);

        cleanLines.push(line);
    }

    // 5. Format as bullet points
    // Limit to top 6 relevant points to keep it short
    const bulletPoints = cleanLines.slice(0, 6).map(line => `• ${line}`);

    return bulletPoints.join('\n');
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
    // Relaxed list: kept "Fashionable", "Winter", etc. as they are descriptive.
    const junkKeywords = [
        'Amazon', 'Independent Station', 'Hot Selling', 'New', '2023', '2024', '2025', 'Cross-border',
        'Explosive', 'Direct Sales', 'Supplier', 'Wholesale', 'Factory', 'In Stock', 'Customizable',
        'Large-sized', 'Small-sized', 'Niche', 'Design', 'High-grade'
    ];

    const junkRegex = new RegExp(`\\b(${junkKeywords.join('|')})\\b`, 'gi');
    processedName = processedName.replace(junkRegex, '');

    // Extra: Remove technical codes like "Ag1-1105", "Drop002", "S925" (unless context implies material?)
    // This regex looks for:
    // - "Drop" followed by digits
    // - "Ag" followed by digits/dashes
    // - Any standalone "A" followed by digits like "A6090"
    processedName = processedName.replace(/\bDrop\d+\b/gi, '');
    processedName = processedName.replace(/\bAg\d+[-]?\d*\b/gi, '');
    processedName = processedName.replace(/\b[A-Z]\d{3,}\b/g, ''); // e.g. A6090

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
