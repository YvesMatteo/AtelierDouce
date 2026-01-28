
import React from 'react';

export default function TermsOfService() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-serif mb-8 text-[#171717]">Terms of Service</h1>

            <div className="prose prose-stone">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">1. Introduction</h2>
                    <p className="text-gray-600 mb-4">
                        Welcome to <strong>Atelier Douce</strong>. By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the website or use any services.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">2. General Conditions</h2>
                    <p className="text-gray-600 mb-4">
                        We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">3. Accuracy, Completeness and Timeliness of Information</h2>
                    <p className="text-gray-600 mb-4">
                        We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">4. Modifications to the Service and Prices</h2>
                    <p className="text-gray-600 mb-4">
                        Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">5. Products or Services</h2>
                    <p className="text-gray-600 mb-4">
                        Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy.
                    </p>
                    <p className="text-gray-600 mb-4">
                        We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">6. Governing Law</h2>
                    <p className="text-gray-600 mb-4">
                        These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of <strong>Switzerland</strong>.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">7. Contact Information</h2>
                    <p className="text-gray-600 mb-4">
                        Questions about the Terms of Service should be sent to us at <a href="mailto:support@atelierdouce.shop" className="text-[#a48354] hover:underline">support@atelierdouce.shop</a>.
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
