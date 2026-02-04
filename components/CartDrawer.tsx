'use client';

import { X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../app/context/CartContext';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import DiscountProgress from './DiscountProgress';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';

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
        itemDiscounts,
        addToCart,
    } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [email, setEmail] = useState('');
    const { trackInitiateCheckout } = useTikTokPixel();

    // Load saved email if available
    useEffect(() => {
        const savedEmail = localStorage.getItem('user_email');
        if (savedEmail) setEmail(savedEmail);
    }, []);

    // Save email to local storage for continuous sync
    useEffect(() => {
        if (email && email.includes('@')) {
            const timer = setTimeout(() => {
                localStorage.setItem('user_email', email);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [email]);

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



        // Track InitiateCheckout
        try {
            cartItems.forEach(item => {
                trackInitiateCheckout({
                    id: item.productId,
                    name: item.name,
                    price: item.price,
                    currency: item.currency || 'USD'
                });
            });
        } catch (e) {
            console.error('Tracking failed', e);
        }

        try {
            // If email is provided, subscribe to newsletter (optional)
            if (email && email.includes('@')) {
                fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, source: 'checkout' })
                }).catch(err => console.error('Subscription error:', err));
            }

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
                    email: email || undefined, // Pass email for abandonment/pre-fill
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
            <div className="fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col">
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
                        cartItems.map((item, index) => {
                            const itemKey = `${item.productId}-${JSON.stringify(item.selectedOptions)}`;
                            const discountDetails = itemDiscounts?.get(itemKey);
                            const hasDiscount = discountDetails && discountDetails.discountAmount > 0;

                            return (
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
                                        {/* Discount Badges on Image */}
                                        {!item.isGift && hasDiscount && discountDetails.badges.map((badge: string, idx: number) => (
                                            <div key={idx} className={`absolute ${idx === 0 ? 'bottom-0 left-0' : 'bottom-5 left-0'} bg-[#D4AF37] text-white text-[10px] uppercase font-bold px-1.5 py-0.5 z-10`}>
                                                {badge}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-medium text-gray-900 pr-4">
                                                    {item.name}
                                                </h3>
                                                <div className="text-right">
                                                    {hasDiscount ? (
                                                        <>
                                                            <p className="text-xs text-gray-400 line-through">
                                                                {currencySymbol}{discountDetails.originalPrice.toFixed(0)}
                                                            </p>
                                                            <p className="text-sm font-medium text-[#D4AF37]">
                                                                {currencySymbol}{discountDetails.finalPrice.toFixed(0)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {currencySymbol}{(item.price * item.quantity).toFixed(0)}
                                                        </p>
                                                    )}
                                                </div>
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
                                            {/* Detailed Discount Note */}
                                            {hasDiscount && discountDetails.note && (
                                                <div className="mt-1 text-xs font-bold text-[#D4AF37]">
                                                    {discountDetails.note}
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
                                                <div className="flex flex-col items-end">
                                                    <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
                                                        Free Gift
                                                    </div>
                                                    <select
                                                        value={item.selectedOptions?.Color || 'Gold'}
                                                        onChange={(e) => {
                                                            const newColor = e.target.value;
                                                            // We need to replace the current free gift with the new variant
                                                            // Since removeFromCart might remove all instances, we should be careful.
                                                            // Actually, since it's a gift, we can just remove it and add the new one.
                                                            // But `removeFromCart` uses exact match of options.
                                                            removeFromCart(item.productId, item.selectedOptions);

                                                            // Add new one
                                                            const newItem = {
                                                                ...item,
                                                                selectedOptions: { Color: newColor },
                                                                image: newColor === 'Gold'
                                                                    ? 'https://cf.cjdropshipping.com/1618206790596.jpg' // Gold
                                                                    : 'https://cf.cjdropshipping.com/1618206790585.jpg' // Silver
                                                            };
                                                            // We need to access addToCart from context, it is available.
                                                            // However, since we are inside map, better to call a wrapper or just use addToCart directly.
                                                            // Wait, addToCart is available in the component scope.

                                                            // PROBLEM: addToCart triggers setIsCartOpen(true) which is redundant but fine.
                                                            // BIGGER PROBLEM: CartContext logic might interfere if we just remove/add?
                                                            // The useEffect checks for *presence* of gift. If we remove it deeply, it might auto-add default?
                                                            // No, useEffect runs on dependency change.

                                                            // Let's use a simpler approach: updateCartItem (if exists) or remove/add.
                                                            // To be safe, let's just trigger a swap.
                                                            // But we don't have `updateItemOptions`.

                                                            // We will hack it slightly: Remove old, Add new.
                                                            // The Context useEffect runs after state updates.
                                                            // If we do both synchronously, it might be fine, or batching might help.

                                                            // Accessing addToCart from the closure above.
                                                            // We'll need to disable the useEffect interference temporarily?
                                                            // Actually, useEffect checks `paidCount >= 4`.
                                                            // If we swap, paidCount is unchanged.
                                                            // Effectively we are just changing the options of the gift item.
                                                            // Since we lack `updateOptions`, we remove and add.

                                                            // NOTE: We need to import addToCart in the main component scope? Yes, we have it.
                                                        }}
                                                        className="text-xs border-gray-200 rounded-sm py-1 px-2 focus:ring-0 focus:border-[#D4AF37] cursor-pointer"
                                                        style={{ fontSize: '12px', paddingRight: '20px' }}
                                                    >
                                                        <option value="Gold">Gold</option>
                                                        <option value="Silver">Silver</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
                        <p className="text-xs text-gray-500 mb-4 text-center">
                            Shipping and taxes calculated at checkout.
                        </p>

                        {/* Email Capture for Newsletter & Abandonment */}
                        <div className="mb-4">
                            <label htmlFor="checkout-email" className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 px-1">
                                Join our newsletter (Optional)
                            </label>
                            <input
                                id="checkout-email"
                                type="email"
                                placeholder="Enter your email for exclusive offers"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-gray-200 py-3 px-4 text-base focus:outline-none focus:border-black transition-colors"
                            />
                        </div>

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
