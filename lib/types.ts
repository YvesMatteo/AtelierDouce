export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    options: {
        name: string;
        values: string[];
    }[];
    cj_product_id?: string;
    cj_sku?: string;
    stripe_product_id?: string;
    stripe_price_id?: string;
    inventory?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    compare_at_price?: number;
    variants?: {
        id: string; // cj_variant_id
        sku?: string;
        price?: number;
        image?: string;
        options: Record<string, string>; // e.g. { Color: "Red", Size: "M" }
    }[];
}

export interface Order {
    id: string;
    stripe_session_id: string;
    stripe_payment_intent?: string;
    customer_email: string;
    customer_name?: string;
    shipping_address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    cj_order_id?: string;
    amount_total: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    options?: Record<string, string>;
    cj_variant_id?: string;
}
