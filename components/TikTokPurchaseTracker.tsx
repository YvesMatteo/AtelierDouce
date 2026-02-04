'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';

interface SessionData {
    amount_total: number;
    currency: string;
    line_items?: {
        data: Array<{
            description: string;
            quantity: number;
            amount_total: number;
            price?: {
                product?: string;
            };
        }>;
    };
}

export default function TikTokPurchaseTracker() {
    const searchParams = useSearchParams();
    const { trackPurchase } = useTikTokPixel();
    const hasTracked = useRef(false);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');

        // Prevent duplicate tracking
        if (!sessionId || hasTracked.current) return;

        // Check if we've already tracked this session
        const trackedSessions = JSON.parse(localStorage.getItem('tiktok_tracked_sessions') || '[]');
        if (trackedSessions.includes(sessionId)) {
            hasTracked.current = true;
            return;
        }

        const fetchAndTrack = async () => {
            try {
                const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
                if (!response.ok) return;

                const session: SessionData = await response.json();

                // Fire the Purchase event
                trackPurchase({
                    orderId: sessionId,
                    value: (session.amount_total || 0) / 100, // Convert from cents
                    currency: session.currency?.toUpperCase() || 'USD',
                    contents: session.line_items?.data?.map((item, index) => ({
                        id: item.price?.product || `item_${index}`,
                        name: item.description || 'Product',
                        price: (item.amount_total || 0) / 100,
                        quantity: item.quantity || 1
                    }))
                });

                // Mark this session as tracked
                hasTracked.current = true;
                trackedSessions.push(sessionId);
                localStorage.setItem('tiktok_tracked_sessions', JSON.stringify(trackedSessions.slice(-50)));

                console.log('TikTok Purchase event fired for session:', sessionId);
            } catch (error) {
                console.error('Failed to track TikTok purchase:', error);
            }
        };

        fetchAndTrack();
    }, [searchParams, trackPurchase]);

    return null;
}
