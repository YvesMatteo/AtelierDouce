
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

    // Sort units by price (ascending: cheapest first)
    units.sort((a, b) => a - b);

    const count = units.length;
    let discount = 0;

    if (count >= 4) {
        // Rule: Buy 4+ items
        // 1. Cheapest (index 0) is FREE
        discount += units[0];

        // 2. Next 2 cheapest (index 1 & 2) are 15% off
        // Note: we need to make sure index 1 and 2 exist (they do, since count >= 4)
        discount += units[1] * 0.15;
        discount += units[2] * 0.15;

        // 3. The rest (most expensive) are full price (no discount added)

    } else if (count >= 2) {
        // Rule: Buy 2 or 3 items
        // The cheapest 2 items get 15% off
        // Indices 0 and 1
        for (let i = 0; i < 2; i++) {
            // Check if item exists (it should since count >= 2, loop runs for 0, 1)
            if (i < count) {
                discount += units[i] * 0.15;
            }
        }
    }

    return discount;
};
