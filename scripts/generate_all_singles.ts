
import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'audit_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const outputDir = path.join(process.cwd(), 'audit_html');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

report.forEach((product: any) => {
    // Sanitize filename
    const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeName}.html`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audit: ${product.name}</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            .images { display: flex; flex-wrap: wrap; gap: 10px; }
            .image-container img { max-width: 150px; max-height: 150px; border: 1px solid #ccc; }
        </style>
    </head>
    <body>
        <h1>${product.name}</h1>
        <div style="background:#eee; padding:10px; margin-bottom:20px;">
            <h3>Options:</h3>
            <pre>${JSON.stringify(product.options, null, 2)}</pre>
        </div>
        <h3>Images (${product.images.length}):</h3>
        <div class="images">
            ${product.images.map((img: string, i: number) => `
                <div class="image-container">
                    <img src="${img}" />
                    <p>Img ${i + 1}</p>
                </div>
            `).join('')}
        </div>
    </body>
    </html>
    `;

    fs.writeFileSync(path.join(outputDir, filename), htmlContent);
    console.log(`Generated: ${filename}`);
});
