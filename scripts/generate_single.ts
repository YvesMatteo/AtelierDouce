
import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'audit_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Target: Imitation Cashmere Scarf
const product = report.find((p: any) => p.name === "Imitation Cashmere Scarf");

if (!product) {
    console.error("Product not found");
    process.exit(1);
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Single Product Audit</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .images { display: flex; flex-wrap: wrap; gap: 10px; }
        .image-container img { max-width: 150px; max-height: 150px; }
    </style>
</head>
<body>
    <h1>${product.name}</h1>
    <pre>${JSON.stringify(product.options, null, 2)}</pre>
    <div class="images">
        ${product.images.map((img: string, i: number) => `
            <div class="image-container">
                <img src="${img}" />
                <p>Image ${i + 1}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(process.cwd(), 'single_product.html'), htmlContent);
console.log("Generated single_product.html");
