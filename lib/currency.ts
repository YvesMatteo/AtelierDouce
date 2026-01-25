export const BASE_PRICE_USD = 49;

// Approximate exchange rates relative to USD (1 USD = X Currency)
// These should ideally be fetched from an API in a real production environment
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92, // Euro
    GBP: 0.79, // British Pound
    CAD: 1.35, // Canadian Dollar
    AUD: 1.52, // Australian Dollar
    JPY: 148.0, // Japanese Yen
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
};

// Map country codes to their primary currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
    US: 'USD',
    GB: 'GBP', // UK
    CA: 'CAD',
    AU: 'AUD',
    JP: 'JPY',
    DE: 'EUR', // Germany
    FR: 'EUR', // France
    ES: 'EUR', // Spain
    IT: 'EUR', // Italy
    NL: 'EUR', // Netherlands
    BE: 'EUR', // Belgium
    AT: 'EUR', // Austria
    IE: 'EUR', // Ireland
    FI: 'EUR', // Finland
    PT: 'EUR', // Portugal
};

export interface CurrencySettings {
    code: string;
    symbol: string;
    rate: number;
}

export function getCurrencyForCountry(countryCode: string = 'US'): CurrencySettings {
    const code = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
    const rate = EXCHANGE_RATES[code] || 1;
    const symbol = CURRENCY_SYMBOLS[code] || '$';

    return { code, symbol, rate };
}

export function calculatePrice(basePriceUsd: number, rate: number): number {
    const converted = basePriceUsd * rate;
    // Always round up to the nearest integer
    return Math.ceil(converted);
}

export function formatPrice(price: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}
