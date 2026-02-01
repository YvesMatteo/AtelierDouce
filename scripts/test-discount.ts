import { calculateDiscount } from '../lib/discount';

function test(name: string, items: any[], expectedDiscount: number) {
    const discount = calculateDiscount(items);
    const pass = Math.abs(discount - expectedDiscount) < 0.01; // Allow float variance
    console.log(`${pass ? '✅' : '❌'} ${name}: Expected ${expectedDiscount}, got ${discount}`);
}

console.log("Testing Discount Logic...");

// Scenario 1: 1 item (No discount)
test("1 Item", [{ price: 100, quantity: 1 }], 0);

// Scenario 2: 2 items (15% off both)
// Cheapest (50) -> 7.5. Expensive (100) -> 15. Total: 22.5.
test("2 Items", [
    { price: 100, quantity: 1 },
    { price: 50, quantity: 1 }
], 22.5);

// Scenario 3: 3 items (15% off cheapest 2 only)
// Prices: 20 (Cheap), 50 (Mid), 100 (Exp).
// Discount: 15% of 20 (3) + 15% of 50 (7.5) = 10.5.
// 100 is full price.
test("3 Items", [
    { price: 100, quantity: 1 },
    { price: 50, quantity: 1 },
    { price: 20, quantity: 1 }
], 10.5);

// Scenario 4: 4 items (Cheapest Free, Next 2 15% off)
// Prices: 10, 20, 30, 100.
// Item 0 (10): Free -> 10.
// Item 1 (20): 15% -> 3.
// Item 2 (30): 15% -> 4.5.
// Item 3 (100): Full.
// Total Discount: 10 + 3 + 4.5 = 17.5.
test("4 Items (Tier 2 Trigger)", [
    { price: 100, quantity: 1 },
    { price: 30, quantity: 1 },
    { price: 20, quantity: 1 },
    { price: 10, quantity: 1 }
], 17.5);

// Scenario 5: 5 items (Cheapest Free, Next 2 15%)
// Prices: 10, 20, 30, 40, 100.
// Item 0 (10): Free -> 10.
// Item 1 (20): 15% -> 3.
// Item 2 (30): 15% -> 4.5.
// Rest (40, 100): Full.
// Total Discount: 17.5.
test("5 Items", [
    { price: 40, quantity: 1 },
    { price: 30, quantity: 1 },
    { price: 20, quantity: 1 },
    { price: 10, quantity: 1 },
    { price: 100, quantity: 1 }
], 17.5);
