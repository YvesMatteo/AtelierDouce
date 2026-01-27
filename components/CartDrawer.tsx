'use client';

import { X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../app/context/CartContext';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import DiscountProgress from './DiscountProgress';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CartDrawer() {
    const {
        isCartOpen,
        toggleCart,
        cartItems,
        removeFromCart,
        updateQuantity,
        cartTotal,
        subtotal,
        discount,
        cartCount,
    } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const currencyCode = cartItems.length > 0 && cartItems[0].currency ? cartItems[0].currency : 'USD';
    const currencySymbol = currencyCode === 'USD' ? '$'
        : currencyCode === 'EUR' ? '€'
            : currencyCode === 'GBP' ? '£'
                : currencyCode === 'JPY' ? '¥'
                    : currencyCode === 'CAD' ? 'CA$'
                        : currencyCode === 'AUD' ? 'A$'
                            : '$';

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        selectedOptions: item.selectedOptions,
                    })),
                    currency: currencyCode, // Pass the currency
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            console.error('Checkout failed:', err);
            alert('Checkout failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (!isCartOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
                onClick={toggleCart}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-xl font-serif">Shopping Cart</h2>
                    <button onClick={toggleCart} className="text-gray-500 hover:text-black transition-colors">
                        <X className="w-6 h-6" strokeWidth={1} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length > 0 && (
                        <DiscountProgress count={cartCount} />
                    )}

                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        cartItems.map((item, index) => (
                            <div key={`${item.productId}-${index}`} className="flex gap-4">
                                <div className="relative w-20 h-24 bg-gray-50 flex-shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                    {item.isGift && (
                                        <div className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[10px] uppercase font-bold px-2 py-0.5">
                                            Gift
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-medium text-gray-900 pr-4">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-900">
                                                {currencySymbol}{(item.price * item.quantity).toFixed(0)}
                                            </p>
                                        </div>
                                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                {Object.entries(item.selectedOptions).map(([key, value]) => (
                                                    <span key={key} className="block">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        {!item.isGift ? (
                                            <>
                                                <div className="flex items-center border border-gray-200">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedOptions)}
                                                        className="p-1 hover:bg-gray-100 transition-colors"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedOptions)}
                                                        className="p-1 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.productId, item.selectedOptions)}
                                                    className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                                                Free Gift Included
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>{currencySymbol}{subtotal ? subtotal.toFixed(0) : '0'}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-[#D4AF37]">
                                    <span>Discount</span>
                                    <span>-{currencySymbol}{discount.toFixed(0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-lg font-medium pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>{currencySymbol}{cartTotal.toFixed(0)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-6 text-center">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-[#232323] text-white py-4 px-8 text-[13px] font-bold uppercase tracking-[0.15em] hover:bg-[#a48354] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isCheckingOut ? 'Processing...' : 'Checkout'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
