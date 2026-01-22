import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center space-y-6 p-8 max-w-md">
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-4xl md:text-5xl font-light text-white">
                    Thank you!
                </h1>

                <div className="space-y-2">
                    <p className="text-stone-300 text-lg">
                        Your order has been placed successfully.
                    </p>
                    <p className="text-stone-500 text-sm">
                        You will receive an email confirmation shortly with your order details and tracking information.
                    </p>
                </div>

                {/* Order Info Card */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-left space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <span className="text-lg">📦</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Order Processing</p>
                            <p className="text-stone-500 text-sm">1-3 business days</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-lg">🚚</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Free Shipping</p>
                            <p className="text-stone-500 text-sm">7-15 business days</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-amber-100 transition-all duration-300 hover:scale-105"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Continue Shopping
                    </Link>
                </div>

                <p className="text-stone-600 text-xs">
                    Questions? Contact us at support@cozy.com
                </p>
            </div>
        </div>
    );
}
