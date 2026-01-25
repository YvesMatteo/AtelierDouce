'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '../app/context/CartContext';

export default function CartIcon() {
    const { toggleCart, cartCount } = useCart();

    return (
        <button
            onClick={toggleCart}
            className="relative hover:text-[#a48354] transition-colors"
            aria-label="Open cart"
        >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#a48354] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                </span>
            )}
        </button>
    );
}
