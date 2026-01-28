
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-serif mb-8 text-[#171717]">Privacy Policy</h1>

            <div className="prose prose-stone">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">1. Introduction</h2>
                    <p className="text-gray-600 mb-4">
                        Atelier Douce ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Atelier Douce.
                    </p>
                    <p className="text-gray-600 mb-4">
                        This policy applies to our website <strong>https://atelierdouce.shop</strong> and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">2. Information We Collect</h2>
                    <p className="text-gray-600 mb-4">
                        We collect information that you provide directly to us when you make a purchase, attempt to make a purchase, or sign up for our newsletter. This includes:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                        <li>Name</li>
                        <li>Billing address and Shipping address</li>
                        <li>Payment information (processed securely by Stripe)</li>
                        <li>Email address</li>
                        <li>Phone number</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">3. How We Use Your Information</h2>
                    <p className="text-gray-600 mb-4">
                        We use the purchase Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                        <li>Communicate with you;</li>
                        <li>Screen our orders for potential risk or fraud; and</li>
                        <li>When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">4. Sharing Your Personal Information</h2>
                    <p className="text-gray-600 mb-4">
                        We share your Personal Information with third parties to help us use your Personal Information, as described above.
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                        <li><strong>Stripe:</strong> We use Stripe to process payments.</li>
                        <li><strong>CJdropshipping:</strong> We use CJdropshipping to fulfill your orders. Your shipping details are shared with them for delivery purposes.</li>
                        <li><strong>Advertising:</strong> We may share data with platforms like Meta (Facebook/Instagram) and TikTok to show you relevant ads.</li>
                    </ul>
                    <p className="text-gray-600 mb-4">
                        Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">5. Your Rights</h2>
                    <p className="text-gray-600 mb-4">
                        If you are a resident of Europe or Switzerland, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">6. Contact Us</h2>
                    <p className="text-gray-600 mb-4">
                        For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at <a href="mailto:support@atelierdouce.shop" className="text-[#a48354] hover:underline">support@atelierdouce.shop</a> or by mail using the details provided below:
                    </p>
                    <address className="not-italic text-gray-600">
                        Atelier Douce<br />
                        Switzerland
                    </address>
                </section>
            </div>
        </div>
    );
}
