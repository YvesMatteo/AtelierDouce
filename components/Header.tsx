'use client';

import Link from 'next/link';
import CartIcon from './CartIcon';
import SearchBar from './SearchBar';

export default function Header() {
    return (
        <nav className="border-b border-gray-100 py-6 px-6 md:px-12 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <div className="hidden md:flex gap-8 text-[13px] tracking-[0.05em] font-sans">
                    <Link href="/#collection" className="hover:text-[#a48354] transition-colors">SHOP</Link>
                    <Link href="#" className="hover:text-[#a48354] transition-colors">ABOUT</Link>
                    <Link href="#" className="hover:text-[#a48354] transition-colors">CONTACT</Link>
                </div>

                <Link href="/" className="text-2xl font-serif tracking-widest text-center absolute left-1/2 -translate-x-1/2 uppercase">
                    AtelierDouce
                </Link>

                <div className="flex items-center gap-6">
                    <div className="relative z-50">
                        <SearchBar />
                    </div>
                    <CartIcon />
                </div>
            </div>
        </nav>
    );
}
