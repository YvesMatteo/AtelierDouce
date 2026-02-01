import Link from 'next/link';

export default function VerifiedPage() {
    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-lg w-full">
                <h1 className="text-4xl md:text-5xl font-serif mb-6">Welcome to the Community</h1>
                <div className="w-12 h-[1px] bg-[#a48354] mx-auto mb-8"></div>

                <p className="text-[#5e5e5e] leading-loose font-light text-[16px] mb-8">
                    Your email has been successfully verified! We've sent your exclusive discount code to your inbox.
                </p>

                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="px-10 py-4 bg-[#171717] text-white text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#a48354] transition-colors duration-300"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}
