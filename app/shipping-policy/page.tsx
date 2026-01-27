
import React from 'react';

export default function ShippingPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-serif mb-8 text-[#171717]">Shipping Policy</h1>

            <div className="prose prose-stone">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">1. Shipping Destinations</h2>
                    <p className="text-gray-600 mb-4">
                        We are proud to offer <strong>worldwide shipping</strong>. However, there are some locations we may be unable to ship to. If you happen to be located in one of those countries, we will contact you.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">2. Shipping Times</h2>
                    <p className="text-gray-600 mb-4">
                        Shipping time varies by location. These are our estimates:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                        <li><strong>Max delivery time:</strong> 14 to 21 business days.</li>
                        <li>This does not include our 2-3 day processing time.</li>
                    </ul>
                    <p className="text-gray-600 mb-4">
                        <em>*All shipping times exclude clearance/customs delays.</em>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">3. Customs and Duties</h2>
                    <p className="text-gray-600 mb-4">
                        Please note that you are responsible for any customs and duties that may apply to your order once it arrives in your country. We are not responsible for any delays caused by the customs department in your country.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">4. Right to Refuse Shipping</h2>
                    <p className="text-gray-600 mb-4">
                        Atelier Douce reserves the right to deny shipping to any specific location or customer at our sole discretion. In such cases, a full refund will be issued promptly.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-serif mb-4 text-[#171717]">5. Tracking Information</h2>
                    <p className="text-gray-600 mb-4">
                        You will receive an email with a tracking number once your order is shipped. For logistical reasons, items in the same purchase may sometimes be sent in separate packages even if you’ve specified combined shipping.
                    </p>
                    <p className="text-gray-600 mb-4">
                        If you have any other questions, please contact us at <a href="mailto:support@atelierdouce.shop" className="text-[#a48354] hover:underline">support@atelierdouce.shop</a> and we will do our best to help you out.
                    </p>
                </section>
            </div>
        </div>
    );
}
