'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BuyButtonProps {
    productId: string;
    productName: string;
    price: number;
    image: string;
    selectedOptions?: Record<string, string>;
}

export default function BuyButton({ productId, productName, price, image, selectedOptions }: BuyButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity: 1,
                    selectedOptions,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else if (data.sessionId) {
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
                    if (error) {
                        console.error('Stripe redirect error:', error);
                    }
                }
            }
        } catch (err: any) {
            console.error('Checkout failed:', err);
            alert('Checkout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[#232323] text-white py-4 px-8 text-[13px] font-bold uppercase tracking-[0.15em] border border-[#232323] hover:bg-white hover:text-[#232323] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
            {loading ? 'Processing...' : `Add to Cart — $${price.toFixed(2)}`}
        </button>
    );
}
