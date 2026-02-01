'use client';

import { useCallback } from 'react';
import { trackTikTokEvent } from '@/lib/tiktok';

export const useTikTokPixel = () => {
    const trackViewContent = useCallback((product: { id: string; name: string; price: number; type?: string; currency?: string }) => {
        trackTikTokEvent('ViewContent', {
            contents: [{
                content_id: product.id,
                content_type: product.type || 'product',
                content_name: product.name,
                price: product.price,
                quantity: 1
            }],
            value: product.price,
            currency: product.currency || 'USD'
        });
    }, []);

    const trackAddToCart = useCallback((product: { id: string; name: string; price: number; type?: string; currency?: string }) => {
        trackTikTokEvent('AddToCart', {
            contents: [{
                content_id: product.id,
                content_type: product.type || 'product',
                content_name: product.name,
                price: product.price,
                quantity: 1
            }],
            value: product.price,
            currency: product.currency || 'USD'
        });
    }, []);

    const trackInitiateCheckout = useCallback((product: { id: string; name: string; price: number; type?: string; currency?: string }) => {
        trackTikTokEvent('InitiateCheckout', {
            contents: [{
                content_id: product.id,
                content_type: product.type || 'product',
                content_name: product.name,
                price: product.price,
                quantity: 1
            }],
            value: product.price,
            currency: product.currency || 'USD'
        });
    }, []);

    const trackSearch = useCallback((query: string) => {
        trackTikTokEvent('Search', {
            search_string: query
        });
    }, []);

    return {
        trackViewContent,
        trackAddToCart,
        trackInitiateCheckout,
        trackSearch
    };
};
