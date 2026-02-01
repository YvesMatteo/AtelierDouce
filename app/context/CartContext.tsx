
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

export interface ItemDiscountDetails {
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    badges: string[]; // "FREE", "20% OFF"
    note?: string; // "1 FREE, 1 @ 20% OFF" for mixed quantities
}

export interface CartContextType {
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
    itemDiscounts: Map<string, ItemDiscountDetails>; // Key: productId + JSON.stringify(options)
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// The Free Gift Product Details (Elegant Collection Piece - Earrings)
// Using ID from DB: a6d7d176-ea9e-4070-b0d1-11cc05ef283d
const GIFT_ITEM: CartItem = {
    productId: 'GIFT-EARRINGS', // Virtual ID
    name: 'Free Gift: Elegant Collection Piece',
    price: 0, // It's free
    image: 'https://cf.cjdropshipping.com/1618206790596.jpg', // Main image (Goldish)
    quantity: 1,
    selectedOptions: { Color: 'Gold' },
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

        if (paidCount >= 5 && !hasGift) {
            // Add gift (Default to Gold)
            setCartItems(prev => [...prev, { ...GIFT_ITEM }]);
        } else if (paidCount < 5 && hasGift) {
            // Remove gift
            setCartItems(prev => prev.filter(i => !i.isGift));
        }
    }, [cartItems, isLoaded]);

    // --- Recovery Logic ---
    useEffect(() => {
        if (!isLoaded) return;
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const recoveryId = params.get('checkout_recovery');

        const handleRecovery = async () => {
            if (!recoveryId) return;

            console.log('🔄 Attempting to recover cart:', recoveryId);
            try {
                const res = await fetch(`/api/abandonment?id=${recoveryId}`);
                const data = await res.json();

                if (data.success && data.cartItems && Array.isArray(data.cartItems)) {
                    // Update cart
                    setCartItems(data.cartItems);
                    setIsCartOpen(true);

                    // Clean URL
                    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                    console.log('✅ Cart recovered successfully!');
                }
            } catch (err) {
                console.error('Failed to recover cart:', err);
            }
        };

        if (recoveryId) {
            handleRecovery();
        }
    }, [isLoaded]);


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
        // We will build a breakdown of every single unit in the cart to strictly determining
        // which specific unit gets which discount.
        // Each unit keeps track of its origin item key.
        type Unit = {
            price: number;
            itemIdKey: string; // `${productId}-${JSON.stringify(selectedOptions)}`
            discountType: 'NONE' | 'FREE' | '15%OFF';
            discountAmount: number;
        };

        let allUnits: Unit[] = [];
        const itemDiscounts = new Map<string, ItemDiscountDetails>();

        // 1. Unroll items into units
        cartItems.forEach(item => {
            if (!item.isGift) {
                const key = `${item.productId}-${JSON.stringify(item.selectedOptions)}`;

                // Initialize map entry if needed
                if (!itemDiscounts.has(key)) {
                    itemDiscounts.set(key, {
                        originalPrice: item.price * item.quantity,
                        finalPrice: item.price * item.quantity,
                        discountAmount: 0,
                        badges: [],
                        note: ''
                    });
                }

                for (let i = 0; i < item.quantity; i++) {
                    allUnits.push({
                        price: item.price,
                        itemIdKey: key,
                        discountType: 'NONE',
                        discountAmount: 0
                    });
                }
            }
        });

        const subtotal = allUnits.reduce((acc, u) => acc + u.price, 0);

        // 2. Sort units by price (ascending) - cheapest first get the best deals usually?
        // Actually, "Buy 3, Get 1 Free (Cheapest)" usually means the cheapest one is free.
        allUnits.sort((a, b) => a.price - b.price);

        const count = allUnits.length;
        let totalDiscount = 0;

        // 3. Apply Rules
        if (count >= 4) {
            // Rule: Buy 4, Get 1 Free (Cheapest)
            // The first unit (index 0) is free.
            allUnits[0].discountType = 'FREE';
            allUnits[0].discountAmount = allUnits[0].price;

            // Rule: Others get 15% off
            for (let i = 1; i < count; i++) {
                allUnits[i].discountType = '15%OFF';
                allUnits[i].discountAmount = allUnits[i].price * 0.15;
            }

        } else if (count >= 3) {
            // Rule: Buy 3, 15% off all
            for (let i = 0; i < count; i++) {
                allUnits[i].discountType = '15%OFF';
                allUnits[i].discountAmount = allUnits[i].price * 0.15;
            }
        }

        // 4. Re-aggregate back to items to form ItemDiscountDetails
        allUnits.forEach(unit => {
            const details = itemDiscounts.get(unit.itemIdKey)!;
            details.discountAmount += unit.discountAmount;

            // Collect badge types
            if (unit.discountType === 'FREE') {
                if (!details.badges.includes('FREE')) details.badges.push('FREE');
            } else if (unit.discountType === '15%OFF') {
                if (!details.badges.includes('15% OFF')) details.badges.push('15% OFF');
            }
        });

        // 5. Finalize details (calculate final price, create notes)
        itemDiscounts.forEach((details, key) => {
            details.finalPrice = details.originalPrice - details.discountAmount;

            // Create a nice note if mixed
            // Re-scan units for this key to count exactly
            const unitsForKey = allUnits.filter(u => u.itemIdKey === key);
            const freeCount = unitsForKey.filter(u => u.discountType === 'FREE').length;
            const off15Count = unitsForKey.filter(u => u.discountType === '15%OFF').length;

            let parts = [];
            if (freeCount > 0) parts.push(`${freeCount} FREE`);
            if (off15Count > 0) parts.push(`${off15Count} x 15% OFF`);

            if (parts.length > 0 && unitsForKey.length > 1) {
                // Determine if we need detailed note
                if (details.badges.length > 1 || (details.badges.length === 1 && unitsForKey.length > ((details.badges[0] === 'FREE' ? freeCount : off15Count)))) {
                    details.note = parts.join(', ');
                }
            }


            totalDiscount += details.discountAmount;
        });

        return { subtotal, discount: totalDiscount, total: subtotal - totalDiscount, itemDiscounts };
    };

    const { subtotal, discount, total: cartTotal, itemDiscounts } = getCalculatedTotals();
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
                itemDiscounts,
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
