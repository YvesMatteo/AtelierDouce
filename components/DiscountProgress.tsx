'use client';

import { Gift, Tag } from 'lucide-react';

interface DiscountProgressProps {
    count: number;
}

export default function DiscountProgress({ count }: DiscountProgressProps) {
    // Tiers: 
    // 0-1: 0%
    // 2-3: 20% OFF (Buy 2)
    // 4+: 1 FREE (Buy 4)

    const percentage = Math.min(100, (count / 4) * 100);

    let message = "";
    if (count < 2) {
        message = `Add ${2 - count} more item(s) to unlock 20% OFF!`;
    } else if (count < 4) {
        message = `20% OFF Unlocked! Add ${4 - count} more for 1 FREE item!`;
    } else {
        message = "🎉 You've unlocked 1 FREE item!";
    }

    return (
        <div className="w-full py-4 text-center">
            <h3 className="text-sm font-medium mb-4 text-[#171717]">
                {message}
            </h3>

            <div className="relative h-3 bg-[#FFF8DC] rounded-full mx-2 mb-8">
                {/* Progress Fill */}
                <div
                    className="absolute left-0 top-0 h-full bg-[#D4AF37] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />

                {/* Tier 1 Marker (Buy 2) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#FFF8DC] z-10 transition-colors duration-300 ${count >= 2 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#e5e5e5] text-gray-300'}`}>
                        <Tag className="w-6 h-6 rotate-90" />
                    </div>
                    <div className="absolute top-14 w-32 text-center text-xs font-bold text-[#171717]">
                        Buy 2, Get 20% FREE
                    </div>
                </div>

                {/* Tier 2 Marker (Buy 4) */}
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#FFF8DC] z-10 transition-colors duration-300 ${count >= 4 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#e5e5e5] text-gray-300'}`}>
                        <Gift className="w-6 h-6" />
                    </div>
                    <div className="absolute top-14 w-20 text-center text-xs font-bold text-[#171717]">
                        1 FREE gift!
                    </div>
                </div>
            </div>
        </div>
    );
}
