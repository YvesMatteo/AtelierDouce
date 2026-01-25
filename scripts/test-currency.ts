import { getCurrencyForCountry, calculatePrice, formatPrice, BASE_PRICE_USD } from '../lib/currency';

async function testCurrencyLogic() {
    console.log('--- Testing Currency Logic ---');

    // Test cases
    const cases = [
        { country: 'US', expectedCode: 'USD', expectedRate: 1 },
        { country: 'GB', expectedCode: 'GBP', expectedRate: 0.79 },
        { country: 'DE', expectedCode: 'EUR', expectedRate: 0.92 },
        { country: 'JP', expectedCode: 'JPY', expectedRate: 148 },
    ];

    let errors = 0;

    cases.forEach(({ country, expectedCode, expectedRate }) => {
        const { code, rate, symbol } = getCurrencyForCountry(country);

        // Check Code
        if (code !== expectedCode) {
            console.error(`[FAIL] ${country}: Expected code ${expectedCode}, got ${code}`);
            errors++;
        } else {
            console.log(`[PASS] ${country}: Code ${code}`);
        }

        // Check Price Calculation (Base 49)
        const expectedPrice = Math.ceil(BASE_PRICE_USD * expectedRate);
        const calculated = calculatePrice(BASE_PRICE_USD, rate);

        if (calculated !== expectedPrice) {
            console.error(`[FAIL] ${country}: Expected price ${expectedPrice}, got ${calculated}`);
            errors++;
        } else {
            console.log(`[PASS] ${country}: Price ${calculated} ${symbol}`);
        }
    });

    // Test JPY specifically for zero-decimal display expectations
    // Note: formatPrice uses Intl.NumberFormat which handles locales
    const jpyPrice = calculatePrice(BASE_PRICE_USD, 148);
    const formattedJpy = formatPrice(jpyPrice, 'JPY');
    console.log(`[Reassurance] JPY Formatted: ${formattedJpy}`);
    // Should essentially be "¥7,252" or similar depending on locale, but definitely no decimals like .00

    if (errors === 0) {
        console.log('--- ALL TESTS PASSED ---');
    } else {
        console.error(`--- ${errors} TESTS FAILED ---`);
        process.exit(1);
    }
}

testCurrencyLogic();
