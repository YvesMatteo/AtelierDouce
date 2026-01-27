
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDiscount } from '@/lib/discount';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    currency?: string;
    image: string;
    quantity: number;
    selectedOptions?: Record<string, string>;
    cj_variant_id?: string;
    isGift?: boolean; // New flag for the free gift
}

interface CartContextType {
    cartItems: CartItem[];
    isCartOpen: boolean;
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string, selectedOptions?: Record<string, string>) => void;
    updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => void;
    clearCart: () => void;
    toggleCart: () => void;
    setIsCartOpen: (isOpen: boolean) => void;
    cartTotal: number;
    subtotal: number;
    discount: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// The Free Gift Product Details (Niche Plaid Cloud Bag - Light Blue)
// Using ID from DB: 2bff64e3-0ff2-4fda-a02f-a4545f2cf578 (CJ ID: 1746094682741936128)
// We use a different ID for the gift version to avoid merging with a paid version of the same bag?
// Or we just use a flag isGift=true.
const GIFT_ITEM: CartItem = {
    productId: 'GIFT-CLOUD-BAG', // Virtual ID to prevent merging with real product
    name: 'Free Gift: Niche Plaid Cloud Bag',
    price: 0, // It's free
    image: 'https://cf.cjdropshipping.com/quick/product/d4273748-7689-4640-ad06-9119fef2c10a.jpg', // Green one or random? Let's use Light Blue or similar.
    quantity: 1,
    selectedOptions: { Color: 'Light Blue' },
    isGift: true
};

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, isLoaded]);

    // Handle Free Gift Logic
    useEffect(() => {
        if (!isLoaded) return;

        // Count only non-gift items
        const paidCount = cartItems.filter(i => !i.isGift).reduce((sum, item) => sum + item.quantity, 0);
        const hasGift = cartItems.some(i => i.isGift);

        if (paidCount >= 4 && !hasGift) {
            // Add gift
            setCartItems(prev => [...prev, { ...GIFT_ITEM }]);
        } else if (paidCount < 4 && hasGift) {
            // Remove gift
            setCartItems(prev => prev.filter(i => !i.isGift));
        }
    }, [cartItems, isLoaded]);


    const addToCart = (newItem: CartItem) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (item) =>
                    item.productId === newItem.productId &&
                    JSON.stringify(item.selectedOptions) === JSON.stringify(newItem.selectedOptions) &&
                    item.cj_variant_id === newItem.cj_variant_id
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += newItem.quantity;
                return newItems;
            } else {
                return [...prevItems, newItem];
            }
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId: string, selectedOptions?: Record<string, string>) => {
        setCartItems((prevItems) =>
            prevItems.filter(
                (item) =>
                    !(
                        item.productId === productId &&
                        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
                    )
            )
        );
    };

    const updateQuantity = (productId: string, quantity: number, selectedOptions?: Record<string, string>) => {
        if (quantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.productId === productId &&
                    JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    // --- Discount Logic ---
    const getCalculatedTotals = () => {
        // Flatten items into single units for easier calculation
        // Exclude the gift item from discount calculations (it's already price 0)
        let units: number[] = [];
        cartItems.forEach(item => {
            if (!item.isGift) {
                for (let i = 0; i < item.quantity; i++) {
                    units.push(item.price);
                }
            }
        });

        // Current subtotal (sum of all paid items actual price)
        const subtotal = units.reduce((a, b) => a + b, 0);

        // Sort units by price (cheapest first)
        units.sort((a, b) => a - b);
        const count = units.length;
        let discount = 0;

        if (count >= 3) {
            // Rule: Buy 3, Get 1 Free (Cheapest)
            // The first item (index 0) is the cheapest.
            discount += units[0]; // 100% off cheapest

            // Rule: Next 2 cheapest items get 20% off
            // Indices 1 and 2 (if they exist)
            if (units.length > 1) discount += units[1] * 0.20;
            if (units.length > 2) discount += units[2] * 0.20;

        } else if (count === 2) {
            // Rule: Buy 2, 20% off both
            discount += units[0] * 0.20;
            discount += units[1] * 0.20;
        }

        const total = subtotal - discount;

        return { subtotal, discount, total };
    };

    const { subtotal, discount, total: cartTotal } = getCalculatedTotals();
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                isCartOpen,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                toggleCart,
                setIsCartOpen,
                cartTotal,
                subtotal,
                discount,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
