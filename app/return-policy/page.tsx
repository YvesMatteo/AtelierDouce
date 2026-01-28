
import React from 'react';

export default function ReturnPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-serif mb-8 text-[#171717]">Return Policy</h1>

            <div className="prose prose-stone">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">1. Overview</h2>
                    <p className="text-gray-600 mb-4">
                        At <strong>Atelier Douce</strong>, we strive to ensure you are satisfied with your purchase. However, due to the nature of our business and logistics, we maintain a strict return policy. Please read the following carefully before making a purchase.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">2. All Sales Are Final</h2>
                    <p className="text-gray-600 mb-4">
                        <strong>We do not accept returns or exchanges for change of mind. All sales are final.</strong>
                    </p>
                    <p className="text-gray-600 mb-4">
                        Please review your order carefully, including size, color, and quantity, before completing your purchase.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">3. Damaged or Defective Items</h2>
                    <p className="text-gray-600 mb-4">
                        In the rare event that you receive a defective or damaged item, you are entitled to a replacement or refund.
                    </p>
                    <p className="text-gray-600 mb-4">
                        To be eligible for a return due to defect:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                        <li>You must contact us within <strong>5 days</strong> of receiving your order.</li>
                        <li>You must provide clear photos or video footage of the defect or damage.</li>
                        <li>The item must be unused and in the same condition that you received it.</li>
                    </ul>
                    <p className="text-gray-600 mb-4">
                        Please send your claim to <a href="mailto:support@atelierdouce.shop" className="text-[#a48354] hover:underline">support@atelierdouce.shop</a> with your order number and evidence of the issue.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">4. Return Shipping</h2>
                    <p className="text-gray-600 mb-4">
                        If a return is exceptionally authorized by our support team (outside of defective items), the <strong>customer is responsible for paying for their own shipping costs</strong> for returning the item. Shipping costs are non-refundable.
                    </p>
                    <p className="text-gray-600 mb-4">
                        If you are shipping an item over $75, you should consider using a trackable shipping service or purchasing shipping insurance. We don’t guarantee that we will receive your returned item.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">5. Contact Us</h2>
                    <p className="text-gray-600 mb-4">
                        For any questions regarding our return policy, please contact us at:
                    </p>
                    <address className="not-italic text-gray-600">
                        <strong>Atelier Douce</strong><br />
                        Switzerland<br />
                        Email: <a href="mailto:support@atelierdouce.shop" className="text-[#a48354] hover:underline">support@atelierdouce.shop</a>
                    </address>
                </section>
            </div>
        </div>
    );
}
