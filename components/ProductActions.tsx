'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import BuyButton from './BuyButton';

interface ProductActionsProps {
    product: Product;
    currentPrice?: number;
    currencyCode?: string;
}

export default function ProductActions({ product, currentPrice, currencyCode }: ProductActionsProps) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

    // Initialize selections if there's only one value for an option
    useEffect(() => {
        const initialSelections: Record<string, string> = {};
        product.options?.forEach(opt => {
            if (opt.values.length === 1) {
                initialSelections[opt.name] = opt.values[0];
            }
        });
        if (Object.keys(initialSelections).length > 0) {
            setSelectedOptions(prev => ({ ...prev, ...initialSelections }));
        }
    }, [product.options]);

    // Find the matching variant when options change
    useEffect(() => {
        if (!product.variants || product.variants.length === 0) return;

        // Check if all options are selected
        const allOptionsSelected = product.options?.every(opt => selectedOptions[opt.name]);

        if (allOptionsSelected) {
            const variant = product.variants.find(v => {
                return Object.entries(v.options).every(([key, value]) => selectedOptions[key] === value);
            });
            setSelectedVariantId(variant?.id);
        } else {
            setSelectedVariantId(undefined);
        }
    }, [selectedOptions, product.variants, product.options]);

    const handleOptionSelect = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName]: value
        }));
    };

    // Check if all required options are selected
    const missingOptions = product.options?.filter(opt => !selectedOptions[opt.name]) || [];
    const isSelectionComplete = missingOptions.length === 0;

    return (
        <div className="space-y-6">
            {/* Dynamic Option Selectors */}
            {product.options?.map((option) => (
                <div key={option.name}>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-[#171717]">
                            {option.name}
                        </label>
                        {option.name.toLowerCase() === 'size' && (
                            <button className="text-[11px] underline text-[#5e5e5e] hover:text-[#171717]">
                                Size Guide
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {option.values.map((val) => (
                            <button
                                key={val}
                                onClick={() => handleOptionSelect(option.name, val)}
                                className={`h-10 px-6 border text-sm transition-all duration-200 min-w-[3rem] ${selectedOptions[option.name] === val
                                        ? 'border-[#171717] bg-[#171717] text-white'
                                        : 'border-[#e5e5e5] hover:border-[#171717] hover:bg-[#171717] hover:text-white'
                                    }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Validation Message */}
            {!isSelectionComplete && missingOptions.length > 0 && Object.keys(selectedOptions).length > 0 && (
                <p className="text-red-500 text-xs mt-2">
                    Please select {missingOptions.map(o => o.name).join(' and ')}
                </p>
            )}

            {/* Add to Cart / Buy Buttons */}
            <div className="pt-4 space-y-3">
                <BuyButton
                    productId={product.id}
                    productName={product.name}
                    price={currentPrice ?? product.price}
                    currency={currencyCode ?? 'USD'}
                    image={product.images?.[0] || ''}
                    selectedOptions={isSelectionComplete ? selectedOptions : undefined}
                    disabled={!isSelectionComplete}
                    cjVariantId={selectedVariantId}
                />
                <p className="text-[11px] text-[#5e5e5e] text-center pt-2">
                    Free shipping on all orders over $100.
                </p>
            </div>
        </div>
    );
}
