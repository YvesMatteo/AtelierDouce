
import fs from 'fs';
import path from 'path';

// Read the audit report
const reportPath = path.join(process.cwd(), 'audit_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Audit Gallery</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .product { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .product h2 { margin-top: 0; }
        .options { background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .images { display: flex; flex-wrap: wrap; gap: 10px; }
        .image-container { text-align: center; }
        .image-container img { max-width: 200px; max-height: 200px; object-fit: contain; border: 1px solid #ddd; }
        .image-container p { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>Product Audit Gallery</h1>
    ${report.map((p: any) => `
        <div class="product" id="${p.id}">
            <h2>${p.name}</h2>
            <div class="options">
                <strong>Current Options:</strong>
                <pre>${JSON.stringify(p.options, null, 2)}</pre>
            </div>
            <div class="images">
                ${p.images.map((img: string, i: number) => `
                    <div class="image-container">
                        <img src="${img}" loading="lazy" />
                        <p>Image ${i + 1}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>
`;

const outputPath = path.join(process.cwd(), 'audit_gallery.html');
fs.writeFileSync(outputPath, htmlContent);
console.log(`Gallery generated at ${outputPath}`);
