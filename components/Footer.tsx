
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#171717] text-white py-12 px-6 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="col-span-1 md:col-span-1">
                    <Link href="/" className="text-xl font-serif tracking-widest uppercase hover:text-[#a48354] transition-colors">
                        Atelier Douce
                    </Link>
                    <p className="mt-4 text-sm text-gray-400">
                        Premium comfort for your home.
                    </p>
                </div>

                {/* Legal Links */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Policy</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/return-policy" className="hover:text-[#a48354] transition-colors">Return Policy</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-[#a48354] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms-of-service" className="hover:text-[#a48354] transition-colors">Terms of Service</Link></li>
                            <li><Link href="/shipping-policy" className="hover:text-[#a48354] transition-colors">Shipping Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Contact</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>Weidstrasse 8</li>
                            <li>Switzerland</li>
                            <li><a href="mailto:support@atelierdouce.shop" className="hover:text-[#a48354] transition-colors">support@atelierdouce.shop</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Atelier Douce. All rights reserved.</p>
            </div>
        </footer>
    );
}
