/**
 * CJDropshipping API Client
 * Documentation: https://developers.cjdropshipping.com/api2.0/v1
 */

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

interface CJProduct {
    id: string;
    nameEn: string;
    sku: string;
    bigImage: string;
    sellPrice: string;
    categoryId: string;
    warehouseInventoryNum: number;
    description?: string;
}

interface CJProductDetails {
    pid: string;
    productName: string;
    productSku: string;
    productImage: string;
    sellPrice: number;
    categoryId: string;
    description: string;
    variants: CJVariant[];
    productImageSet: string[];
}

interface CJVariant {
    vid: string;
    variantSku: string;
    variantNameEn: string;
    variantImage: string;
    variantSellPrice: number;
    variantStandard: string; // e.g., "Size:40,Color:Black"
}

interface CJOrderRequest {
    orderNumber: string;
    shippingZip: string;
    shippingCountry: string;
    shippingCountryCode: string;
    shippingProvince: string;
    shippingCity: string;
    shippingAddress: string;
    shippingCustomerName: string;
    shippingPhone: string;
    products: {
        vid: string;
        quantity: number;
    }[];
    payType?: number; // 1 = balance, 2 = card
    remark?: string;
}

interface CJApiResponse<T> {
    code: number;
    result: boolean;
    message: string;
    data: T;
    success: boolean;
}

class CJDropshippingClient {
    private accessToken: string;

    constructor() {
        const token = process.env.CJ_ACCESS_TOKEN;
        if (!token) {
            throw new Error('CJ_ACCESS_TOKEN environment variable is not set');
        }
        this.accessToken = token;
    }

    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        body?: object
    ): Promise<T> {
        const url = `${CJ_API_BASE}${endpoint}`;

        const headers: HeadersInit = {
            'CJ-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json() as CJApiResponse<T>;

        if (!data.success) {
            throw new Error(`CJ API Error: ${data.message} (code: ${data.code})`);
        }

        return data.data;
    }

    /**
     * Search products with optional filters
     */
    async searchProducts(params: {
        keyWord?: string;
        categoryId?: string;
        page?: number;
        size?: number;
        minPrice?: number;
        maxPrice?: number;
    } = {}): Promise<{ content: { productList: CJProduct[] }[]; totalRecords: number }> {
        const queryParams = new URLSearchParams();

        if (params.keyWord) queryParams.append('keyWord', params.keyWord);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.size) queryParams.append('size', params.size.toString());
        if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
        if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());

        return this.request(`/product/listV2?${queryParams.toString()}`);
    }

    /**
     * Get detailed product information including variants
     */
    async getProductDetails(productId: string): Promise<CJProductDetails> {
        return this.request(`/product/query?pid=${productId}`);
    }

    /**
     * Get product variants
     */
    async getProductVariants(productId: string): Promise<CJVariant[]> {
        const data = await this.request<{ list: CJVariant[] }>(`/product/variant/query?pid=${productId}`);
        return data.list || [];
    }

    /**
     * Create an order in CJDropshipping
     */
    async createOrder(order: CJOrderRequest): Promise<{ orderId: string; orderNum: string }> {
        return this.request('/shopping/order/createOrderV2', 'POST', order);
    }

    /**
     * Query order status
     */
    async getOrderStatus(orderId: string): Promise<{
        orderId: string;
        orderStatus: string;
        trackNumber?: string;
        logisticName?: string;
    }> {
        return this.request(`/shopping/order/getOrderDetail?orderId=${orderId}`);
    }

    /**
     * Get available shipping methods for a product to a country
     */
    async getShippingMethods(params: {
        startCountryCode?: string;
        endCountryCode: string;
        productWeight: number;
    }): Promise<{
        logisticName: string;
        logisticAging: string;
        logisticPrice: number;
    }[]> {
        const queryParams = new URLSearchParams({
            startCountryCode: params.startCountryCode || 'CN',
            endCountryCode: params.endCountryCode,
            productWeight: params.productWeight.toString(),
        });

        const data = await this.request<{ list: any[] }>(`/logistic/freightCalculate?${queryParams.toString()}`);
        return data.list || [];
    }
}

// Singleton instance
let cjClient: CJDropshippingClient | null = null;

export function getCJClient(): CJDropshippingClient {
    if (!cjClient) {
        cjClient = new CJDropshippingClient();
    }
    return cjClient;
}

export type { CJProduct, CJProductDetails, CJVariant, CJOrderRequest };
