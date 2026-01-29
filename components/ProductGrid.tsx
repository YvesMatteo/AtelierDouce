'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types';

interface ProductGridProps {
    products: Product[];
    rate: number;
    code: string;
}

export default function ProductGrid({ products, rate, code }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-20 text-[#5e5e5e]">
                No products found in this category.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => (
                <div key={product.id} className="min-w-0">
                    <ProductCard product={product} rate={rate} code={code} />
                </div>
            ))}
        </div>
    );
}
