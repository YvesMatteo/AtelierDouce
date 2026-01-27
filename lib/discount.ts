
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

    if (count >= 3) {
        // Rule: Buy 3, Get 1 Free (Cheapest)
        // The first item (index 0) is the cheapest.
        discount += units[0]; // 100% off cheapest

        // Rule: Next 2 cheapest items get 20% off
        // Indices 1 and 2 (if they exist)
        if (units.length > 1) discount += units[1] * 0.20;
        if (units.length > 2) discount += units[2] * 0.20;

    } else if (count === 2) {
        // Rule: Buy 2, 20% off both
        discount += units[0] * 0.20;
        discount += units[1] * 0.20;
    }

    return discount;
};
