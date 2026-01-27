'use client';

import { Gift, Tag, ShoppingBag } from 'lucide-react';

interface DiscountProgressProps {
    count: number;
}

export default function DiscountProgress({ count }: DiscountProgressProps) {
    // Tiers: 
    // 2: 20% OFF
    // 3: 1 FREE ITEM
    // 4: FREE GIFT

    let percentage = 0;
    if (count >= 4) percentage = 100;
    else if (count === 3) percentage = 75;
    else if (count === 2) percentage = 50;
    else if (count === 1) percentage = 25;

    let message = "";
    if (count < 2) {
        message = `Add ${2 - count} more item(s) to unlock 20% OFF!`;
    } else if (count < 3) {
        message = `20% OFF Unlocked! Add ${3 - count} more for 1 FREE ITEM!`;
    } else if (count < 4) {
        message = `1 FREE ITEM Unlocked! Add ${4 - count} more for a FREE GIFT!`;
    } else {
        message = "🎉 You've unlocked ALL offers + FREE GIFT!";
    }

    return (
        <div className="w-full py-4 text-center">
            <h3 className="text-sm font-medium mb-4 text-[#171717]">
                {message}
            </h3>

            <div className="relative h-3 bg-[#FFF8DC] rounded-full mx-2 mb-10 w-[95%] mx-auto">
                {/* Progress Fill */}
                <div
                    className="absolute left-0 top-0 h-full bg-[#D4AF37] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />

                {/* Tier 1 Marker (Buy 2) - 50% position */}
                <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#FFF8DC] z-10 transition-colors duration-300 ${count >= 2 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#e5e5e5] text-gray-300'}`}>
                        <Tag className="w-4 h-4 rotate-90" />
                    </div>
                    <div className="absolute top-10 w-24 text-center text-[10px] font-bold text-[#171717]">
                        20% OFF
                    </div>
                    <div className="absolute -bottom-6 text-[10px] text-gray-400 font-medium">Buy 2</div>
                </div>

                {/* Tier 2 Marker (Buy 3) - 75% position */}
                <div className="absolute left-[75%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#FFF8DC] z-10 transition-colors duration-300 ${count >= 3 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#e5e5e5] text-gray-300'}`}>
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="absolute top-10 w-24 text-center text-[10px] font-bold text-[#171717]">
                        1 FREE ITEM
                    </div>
                    <div className="absolute -bottom-6 text-[10px] text-gray-400 font-medium">Buy 3</div>
                </div>

                {/* Tier 3 Marker (Buy 4) - 100% position */}
                <div className="absolute left-[100%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#FFF8DC] z-10 transition-colors duration-300 ${count >= 4 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#e5e5e5] text-gray-300'}`}>
                        <Gift className="w-4 h-4" />
                    </div>
                    <div className="absolute top-10 w-20 text-center text-[10px] font-bold text-[#171717]">
                        FREE GIFT
                    </div>
                    <div className="absolute -bottom-6 text-[10px] text-gray-400 font-medium">Buy 4</div>
                </div>
            </div>
        </div>
    );
}
