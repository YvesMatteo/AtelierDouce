export type TikTokEventType =
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'Search'
    | 'PlaceAnOrder'
    | 'CompleteRegistration'
    | 'Purchase';

export interface TikTokEventParams {
    contents?: {
        content_id?: string;
        content_type?: string;
        content_name?: string;
        price?: number;
        quantity?: number;
    }[];
    value?: number;
    currency?: string;
    search_string?: string;
    email?: string;
    phone_number?: string;
}

declare global {
    interface Window {
        ttq?: {
            track: (event: TikTokEventType, params?: TikTokEventParams) => void;
            page: () => void;
            load: (id: string) => void;
            identify: (params: { email?: string; phone_number?: string; external_id?: string }) => void;
        };
    }
}

export const trackTikTokEvent = (event: TikTokEventType, params?: TikTokEventParams) => {
    if (typeof window !== 'undefined' && window.ttq) {
        window.ttq.track(event, params);
    } else {
        console.warn('TikTok Pixel not loaded');
    }
};
