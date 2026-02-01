'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import SearchBar from './SearchBar';



export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { toggleCart, cartCount } = useCart();

    const reset = () => {
        setIsOpen(false);
    };

    const CATEGORIES = [
        { name: 'New Arrivals', href: '/?sort=new' },
        { name: 'Clothing', href: '/?category=Clothing' },
        { name: 'Shoes', href: '/?category=Shoes' },
        { name: 'Bags', href: '/?category=Bags' },
        { name: 'Jewelry', href: '/?category=Jewelry' },
        { name: 'Accessories', href: '/?category=Accessories' },
    ];

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
                    {/* Search Bar */}
                    <SearchBar />
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
                    <span className="text-sm font-bold uppercase tracking-widest">Menu</span>

                    <button
                        onClick={reset}
                        className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 pb-6">
                    <ul className="space-y-6">
                        {CATEGORIES.map((item) => (
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
                        <li className="pt-4 border-t border-gray-100">
                            <Link href="/?category=All" onClick={reset} className="text-lg font-serif text-[#171717] hover:text-[#a48354] transition-colors block">
                                Shop All
                            </Link>
                        </li>
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

