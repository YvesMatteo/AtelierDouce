'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import CartIcon from './CartIcon';
import SearchModal from './SearchModal';

export default function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            {/* Top Bar */}
            <div className="bg-[#232323] text-white text-[11px] py-2.5 text-center tracking-[0.2em] font-sans font-semibold uppercase">
                Free Shipping worldwide
            </div>

            {/* Navigation */}
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
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="hover:text-[#a48354] transition-colors"
                            aria-label="Search products"
                        >
                            <Search className="w-5 h-5" strokeWidth={1} />
                        </button>
                        <CartIcon />
                    </div>
                </div>
            </nav>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
