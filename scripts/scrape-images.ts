
import puppeteer from 'puppeteer';

const URL = 'https://qksource.com/product/fox-fur-ear-warmers-for-warmth-and-frost-protection-p-2512230236071631600.html';

async function scrapeImages() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set User Agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Page loaded. Extracting images...');

    // Extract images
    const images = await page.evaluate(() => {
        const imgElements = Array.from(document.querySelectorAll('img'));

        // Filter for probable product images
        // Usually CJ/QKSource images are hosted on cf.cjdropshipping.com or oss.yesourcing.com
        // And we want high res ones.

        const candidates = imgElements
            .map(img => img.src)
            .filter(src => {
                return src.includes('oss.yesourcing.com') || src.includes('cf.cjdropshipping.com');
            });

        // Look for background images in swatches or gallery thumbs if regular imgs aren't enough
        // But usually main gallery has <img> tags.


        // Clean URLs: remove query params to get original, or keep query if needed but remove resizing
        const cleanImages = candidates
            .map(src => {
                try {
                    const url = new URL(src);
                    url.searchParams.delete('x-oss-process');
                    return url.toString();
                } catch (e) { return src; }
            })
            .filter(src => !src.includes('w_60') && !src.includes('w_32')); // Double check invalid thumbs

        return [...new Set(cleanImages)];
    });

    console.log(`Found ${images.length} images.`);
    // console.log(JSON.stringify(images, null, 2));

    const fs = await import('fs');
    fs.writeFileSync('images.json', JSON.stringify(images, null, 2));
    console.log('Saved to images.json');

    await browser.close();
}

scrapeImages().catch(console.error);
