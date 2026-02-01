'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';

interface BuyButtonProps {
    productId: string;
    productName: string;
    price: number;
    currency: string;
    image: string;
    selectedOptions?: Record<string, string>;
    disabled?: boolean;
    cjVariantId?: string;
}

export default function BuyButton({ productId, productName, price, currency, image, selectedOptions, disabled, cjVariantId }: BuyButtonProps) {
    const [loading, setLoading] = useState(false);
    const { addToCart } = useCart();
    const { trackAddToCart } = useTikTokPixel();

    const handleAddToCart = async () => {
        setLoading(true);
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        addToCart({
            productId,
            name: productName,
            price,
            currency,
            image,
            quantity: 1,
            selectedOptions,
            cj_variant_id: cjVariantId,
        });

        trackAddToCart({
            id: productId,
            name: productName,
            price: price,
            currency: currency
        });

        setLoading(false);
    };

    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(price);

    return (
        <button
            onClick={handleAddToCart}
            disabled={loading || disabled}
            className="w-full bg-[#232323] text-white py-4 px-8 text-[13px] font-bold uppercase tracking-[0.15em] border border-[#232323] hover:bg-white hover:text-[#232323] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
            {loading ? 'Adding...' : `Add to Cart — ${formattedPrice}`}
        </button>
    );
}
