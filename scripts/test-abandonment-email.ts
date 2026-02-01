
import 'dotenv/config';
import { resend, FROM_EMAIL } from '../lib/resend';
import { renderEmailLayout } from '../lib/email-templates';

async function sendTestAbandonmentEmail() {
    const testEmail = 'yves.matro@gmail.com';
    console.log(`🚀 Sending test abandonment email to ${testEmail}...`);

    const dummyItems = [
        {
            name: 'Luxe Fox Fur Ear Warmers',
            quantity: 1,
            price: 49.95,
            image: 'https://www.atelierdouce.shop/product-images/luxe-ear-warmers/01-light-brown.png'
        },
        {
            name: 'Winter Outdoor Body Hoodie',
            quantity: 2,
            price: 89.00,
            image: 'https://www.atelierdouce.shop/product-images/warm-hooded-jacket-white-bg.png'
        }
    ];

    const itemsHtml = dummyItems.map((item) => `
        <div class="product-card">
            <div class="product-image">
                <img src="${item.image}" alt="${item.name}" style="width: 80px; height: auto; border: 1px solid #eee;" />
            </div>
            <div class="product-details">
                <h3 class="product-name">${item.name}</h3>
                <p class="product-meta">Qty: ${item.quantity}</p>
                <p class="product-price">$${item.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');

    const htmlContent = renderEmailLayout({
        title: 'Your Cart is Waiting',
        previewText: 'Don\'t let your favorites get away.',
        content: `
            <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #171717; margin-bottom: 8px;">Wait, you forgot something?</h2>
            <div class="accent-line"></div>
            <p style="color: #5e5e5e; margin-bottom: 32px;">
                We noticed you left some beautiful pieces in your cart. 
                Your style is impeccable, and we'd love to help you finish your look.
            </p>
            
            <div style="margin: 30px 0;">
                ${itemsHtml}
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="https://www.atelierdouce.shop/cart" class="btn">
                    Return to Cart
                </a>
            </div>
        `
    });

    // Debug: Print HTML length
    console.log(`📝 Generated HTML length: ${htmlContent.length} characters`);

    // Debug: Write to file (optional, but good for local check if needed)
    // await Bun.write('debug-email.html', htmlContent); 

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: testEmail,
            subject: 'Test 3: You left something behind at Atelier Douce!',
            html: htmlContent
        });

        if (error) {
            console.error('❌ Error sending test email:', error);
        } else {
            console.log(`✅ Test email sent successfully! ID: ${data?.id}`);
        }
    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
    }
}

sendTestAbandonmentEmail();
