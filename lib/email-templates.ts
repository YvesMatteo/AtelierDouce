/**
 * Shared email branding and layout system for Atelier Douce.
 * Designed to mirror the premium, minimalist aesthetic of the website.
 */

interface EmailLayoutProps {
    title: string;
    previewText?: string;
    content: string;
}

export const EMAIL_COLORS = {
    background: '#faf2e6', // Soft beige
    white: '#ffffff',
    text: '#333333',
    muted: '#5e5e5e',
    primary: '#171717', // Black
    accent: '#a48354', // Pure gold/brass
};

export const renderEmailLayout = ({ title, previewText, content }: EmailLayoutProps) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=Inter:wght@300;400;600&display=swap');
        
        body {
            background-color: ${EMAIL_COLORS.background};
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${EMAIL_COLORS.white};
            overflow: hidden;
        }
        .header {
            padding: 40px 20px;
            text-align: center;
            background-color: ${EMAIL_COLORS.white};
        }
        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: ${EMAIL_COLORS.primary};
            text-decoration: none;
        }
        .content {
            padding: 20px 40px 40px 40px;
            font-family: 'Inter', sans-serif;
            font-size: 15px;
            line-height: 1.8;
            color: ${EMAIL_COLORS.text};
            text-align: center;
        }
        .accent-line {
            width: 40px;
            height: 1px;
            background-color: ${EMAIL_COLORS.accent};
            margin: 20px auto;
        }
        .footer {
            padding: 40px 20px;
            background-color: ${EMAIL_COLORS.primary};
            color: ${EMAIL_COLORS.white};
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            letter-spacing: 1px;
        }
        .btn {
            display: inline-block;
            background-color: ${EMAIL_COLORS.primary};
            color: ${EMAIL_COLORS.white} !important;
            padding: 16px 36px;
            text-decoration: none;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 13px;
            margin-top: 20px;
            border-radius: 0px;
        }
        .product-card {
            display: table;
            width: 100%;
            margin-bottom: 24px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 24px;
        }
        .product-image {
            display: table-cell;
            width: 120px;
            vertical-align: middle;
        }
        .product-details {
            display: table-cell;
            padding-left: 20px;
            vertical-align: middle;
        }
        .product-name {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            margin: 0 0 4px 0;
            color: ${EMAIL_COLORS.primary};
        }
        .product-meta {
            font-size: 13px;
            color: ${EMAIL_COLORS.muted};
            margin: 0;
        }
        .product-price {
            font-weight: 600;
            font-size: 15px;
            color: ${EMAIL_COLORS.primary};
            margin: 4px 0 0 0;
        }
    </style>
</head>
<body>
    <div style="display: none; font-size: 1px; color: transparent; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${previewText || ''}
    </div>
    <div class="container">
        <div class="header">
            <a href="https://www.atelierdouce.shop" class="logo">Atelier Douce</a>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <div style="margin-bottom: 20px;">ATELIER DOUCE</div>
            <div style="opacity: 0.6;">&copy; 2026 Atelier Douce. All rights reserved.</div>
            <div style="opacity: 0.6; margin-top: 10px;">Switzerland | support@atelierdouce.shop</div>
        </div>
    </div>
</body>
</html>
    `;
};
