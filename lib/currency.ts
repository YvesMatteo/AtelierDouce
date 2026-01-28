export const BASE_PRICE_USD = 1;

// Approximate exchange rates relative to USD (1 USD = X Currency)
// These should ideally be fetched from an API in a real production environment
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92, // Euro
    GBP: 0.79, // British Pound
    CAD: 1.35, // Canadian Dollar
    AUD: 1.52, // Australian Dollar
    JPY: 148.0, // Japanese Yen
    CHF: 0.88, // Swiss Franc
    SEK: 10.5, // Swedish Krona
    NOK: 10.6, // Norwegian Krone
    DKK: 6.9, // Danish Krone
    PLN: 4.0, // Polish Zloty
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF ',
    SEK: 'kr ',
    NOK: 'kr ',
    DKK: 'kr. ',
    PLN: 'zł ',
};

// Map country codes to their primary currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
    US: 'USD',
    GB: 'GBP', // UK
    CA: 'CAD',
    AU: 'AUD',
    JP: 'JPY',

    // Eurozone
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
    AT: 'EUR', IE: 'EUR', FI: 'EUR', PT: 'EUR', GR: 'EUR',
    LU: 'EUR', CY: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
    MT: 'EUR', SK: 'EUR', SI: 'EUR', HR: 'EUR',

    // Other Europe
    CH: 'CHF', // Switzerland
    SE: 'SEK', // Sweden
    NO: 'NOK', // Norway
    DK: 'DKK', // Denmark
    PL: 'PLN', // Poland
    LI: 'CHF', // Liechtenstein
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
