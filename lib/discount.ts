
export const calculateDiscount = (
    items: { price: number; quantity: number; isGift?: boolean }[]
) => {
    // Expand items into individual units for easier calculation
    // Exclude gift items
    let units: number[] = [];

    items.forEach(item => {
        if (!item.isGift) {
            for (let i = 0; i < item.quantity; i++) {
                units.push(item.price);
            }
        }
    });

    // Sort units by price (cheapest first)
    // Important: we assume price is in the same unit (e.g. all dollars or all cents)
    units.sort((a, b) => a - b);

    const count = units.length;
    let discount = 0;

    if (count >= 4) {
        // Rule: Buy 4, Get 1 Free (Cheapest)
        // The first item (index 0) is the cheapest.
        discount += units[0]; // 100% off cheapest

        // Rule: Next cheapest items get 15% off
        // Indices 1, 2, 3...
        for (let i = 1; i < count; i++) {
            discount += units[i] * 0.15;
        }

    } else if (count >= 3) {
        // Rule: Buy 3, 15% off all
        for (let i = 0; i < count; i++) {
            discount += units[i] * 0.15;
        }
    }

    return discount;
};
