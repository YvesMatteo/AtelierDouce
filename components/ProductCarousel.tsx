
'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types';

interface ProductCarouselProps {
    products: Product[];
    rate: number;
    code: string;
}

export default function ProductCarousel({ products, rate, code }: ProductCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: 'start', slidesToScroll: 1 },
        [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-20 text-[#5e5e5e]">
                No products found in this category.
            </div>
        );
    }

    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4 touch-pan-y">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 pl-4"
                        >
                            <ProductCard product={product} rate={rate} code={code} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white shadow-lg"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5 text-[#171717]" />
            </button>

            <button
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white shadow-lg"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5 text-[#171717]" />
            </button>
        </div>
    );
}
