
import { calculateDiscount } from '../lib/discount';

// Helper to run test
const runTest = (name: string, items: { price: number; quantity: number, isGift?: boolean }[], expectedDiscount: number) => {
    const discount = calculateDiscount(items);
    // Use epsilon for float comparison
    const passed = Math.abs(discount - expectedDiscount) < 0.01;
    console.log(`${passed ? '✅' : '❌'} ${name}: Expected ${expectedDiscount}, Got ${discount}`);
    if (!passed) process.exit(1);
};

// Tests
console.log('Testing Discount Logic...');

// Case 1: 1 Item (No discount)
runTest('1 Item ($100)', [{ price: 100, quantity: 1 }], 0);

// Case 2: 2 Items (20% off both)
// Items: 100, 100. Discount = 20 + 20 = 40.
runTest('2 Items ($100)', [{ price: 100, quantity: 2 }], 40);

// Case 3: 3 Items (Cheapest Free + 20% off next 2 which are not there)
// Items: 50, 100, 100. Sorted: 50, 100, 100.
// Free: 50.
// Next 2 (100, 100): 20% off each = 20 + 20 = 40.
// Total Discount: 50 + 40 = 90.
runTest('3 Items (50, 100, 100)', [
    { price: 50, quantity: 1 },
    { price: 100, quantity: 2 }
], 90);

// Case 4: 4 Items (Cheapest Free + 20% off next 2)
// Items: 50, 100, 100, 100. Sorted: 50, 100, 100, 100.
// Free: 50.
// Next 2 (100, 100): 20% off each = 40.
// 4th Item (100): No discount.
// Total Discount: 90.
runTest('4 Items (50, 100, 100, 100)', [
    { price: 50, quantity: 1 },
    { price: 100, quantity: 3 }
], 90);

// Case 5: Gift Item (Should be ignored)
runTest('Gift Item Ignored', [
    { price: 100, quantity: 1 },
    { price: 0, quantity: 1, isGift: true }
], 0);

console.log('All tests passed!');
