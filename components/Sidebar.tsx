'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, Search } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import SearchModal from './SearchModal';

/**
 * Taxonomy definition
 * Gender -> Categories
 */
const TAXONOMY = {
    Woman: [
        { name: 'New Arrivals', href: '/?gender=Woman&sort=new' },
        { name: 'Clothing', href: '/?gender=Woman&category=Clothing' },
        { name: 'Shoes', href: '/?gender=Woman&category=Shoes' },
        { name: 'Bags', href: '/?gender=Woman&category=Bags' },
        { name: 'Jewelry', href: '/?gender=Woman&category=Jewelry' },
        { name: 'Accessories', href: '/?gender=Woman&category=Accessories' },
    ],
    Man: [
        // Placeholder for future
        { name: 'New Arrivals', href: '/?gender=Man&sort=new' },
    ]
};

type ViewState = 'MAIN' | 'WOMAN' | 'MAN';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [view, setView] = useState<ViewState>('MAIN');
    const { toggleCart, cartCount } = useCart();

    const reset = () => {
        setIsOpen(false);
        setTimeout(() => setView('MAIN'), 300); // Reset view after transition
    };

    return (
        <>
            {/* Header / Navbar */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Open Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    {/* ... Search button ... */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-xl font-serif tracking-widest uppercase hover:text-[#a48354] transition-colors">
                    Atelier Douce
                </Link>

                <div className="flex items-center gap-4">
                    {/* ... Cart button ... */}
                    <button
                        onClick={toggleCart}
                        className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors relative"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-[#a48354] text-white text-[10px] flex items-center justify-center rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm transition-opacity"
                    onClick={reset}
                />
            )}


            {/* Sidebar Menu */}
            <div className={`fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-6 flex justify-between items-center">
                    {view !== 'MAIN' ? (
                        <button onClick={() => setView('MAIN')} className="text-sm font-bold uppercase tracking-widest hover:text-[#a48354] flex items-center gap-1">
                            ← Back
                        </button>
                    ) : (
                        <span className="text-sm font-bold uppercase tracking-widest">Menu</span>
                    )}

                    <button
                        onClick={reset}
                        className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 pb-6">
                    <ul className="space-y-6">
                        {view === 'MAIN' && (
                            <>
                                <li>
                                    <button onClick={() => setView('WOMAN')} className="text-2xl font-serif text-[#171717] hover:text-[#a48354] transition-colors w-full text-left flex justify-between items-center group">
                                        Woman
                                        <span className="text-sm text-gray-300 group-hover:text-[#a48354] transition-colors">→</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setView('MAN')} className="text-2xl font-serif text-[#171717] hover:text-[#a48354] transition-colors w-full text-left flex justify-between items-center group">
                                        Man
                                        <span className="text-sm text-gray-300 group-hover:text-[#a48354] transition-colors">→</span>
                                    </button>
                                </li>
                                <li className="pt-4 border-t border-gray-100">
                                    <Link href="/" onClick={reset} className="text-lg font-serif text-[#171717] hover:text-[#a48354] transition-colors block">
                                        Shop All
                                    </Link>
                                </li>
                            </>
                        )}

                        {view === 'WOMAN' && (
                            <>
                                <li className="mb-6">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Woman's Collection</span>
                                </li>
                                {TAXONOMY.Woman.map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={reset}
                                            className="text-xl font-serif text-[#171717] hover:text-[#a48354] transition-colors block"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}

                        {view === 'MAN' && (
                            <>
                                <li className="mb-6">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Man's Collection</span>
                                </li>
                                <li>
                                    <p className="text-sm text-gray-500 italic">Coming soon...</p>
                                </li>
                                {TAXONOMY.Man.map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={reset}
                                            className="text-xl font-serif text-[#171717] hover:text-[#a48354] transition-colors block"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </nav>

                <div className="border-t border-gray-100 p-6 space-y-4 text-sm text-[#5e5e5e]">
                    <Link href="#" className="block hover:text-black">About</Link>
                    <Link href="#" className="block hover:text-black">Contact</Link>
                    <Link href="#" className="block hover:text-black">Shipping & Returns</Link>
                </div>
            </div>
        </>
    );
}
