import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 text-center border border-stone-100">

                {/* Elegant Success Animation */}
                <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-8 animate-fade-in-up">
                    <svg className="w-8 h-8 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>

                <h1 className="text-4xl font-serif text-stone-900 mb-4 tracking-tight">
                    Thank you
                </h1>

                <p className="text-stone-600 text-lg font-sans leading-relaxed mb-8">
                    Your order has been placed successfully.<br />
                    A confirmation email is on its way.
                </p>

                {/* Info Card */}
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 text-left mb-8 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-full shadow-sm text-lg">📦</div>
                        <div>
                            <p className="text-stone-900 font-medium font-serif">Order Processing</p>
                            <p className="text-stone-500 text-sm font-sans">1-3 business days</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-full shadow-sm text-lg">🚚</div>
                        <div>
                            <p className="text-stone-900 font-medium font-serif">Estimated Delivery</p>
                            <p className="text-stone-500 text-sm font-sans">7-15 business days</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="block w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all duration-300 font-sans shadow-lg shadow-stone-900/10 hover:shadow-stone-900/20 transform hover:-translate-y-0.5"
                    >
                        Continue Shopping
                    </Link>

                    <p className="text-stone-400 text-xs font-sans mt-8">
                        Questions? Contact us at support@atelierdouce.shop
                    </p>
                </div>
            </div>
        </div>
    );
}
