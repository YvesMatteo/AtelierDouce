'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    currency?: string;
    image: string;
    quantity: number;
    selectedOptions?: Record<string, string>;
    cj_variant_id?: string;
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
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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

    const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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
