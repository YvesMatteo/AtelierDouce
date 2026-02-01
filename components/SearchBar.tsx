'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SearchBar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { trackSearch } = useTikTokPixel();

    // Debounced search logic from original SearchModal
    const searchProducts = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, price, images, category')
                .ilike('name', `%${searchQuery}%`)
                .limit(5); // Limit to 5 for compact dropdown

            if (!error && data) {
                setSuggestions(data);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) searchProducts(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchProducts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                // Only collapse if query is empty, otherwise keep open so user can see what they typed? 
                // Actually standard behavior is often to collapse, or keep open. 
                // Let's collapse if click outside.
                if (!query) {
                    setIsExpanded(false);
                }
                setSuggestions([]); // Hide suggestions
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [query]);

    const handleSearchClick = () => {
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleClose = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsExpanded(false);
        setQuery('');
        setSuggestions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            trackSearch(query.trim());
            router.push(`/?search=${encodeURIComponent(query.trim())}`);
            setIsExpanded(false);
            setSuggestions([]);
            setQuery('');
        }
    };

    const navigateToProduct = (productId: string) => {
        router.push(`/product/${productId}`);
        setIsExpanded(false);
        setSuggestions([]);
        setQuery('');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF',
        }).format(price);
    };

    return (
        <div ref={searchRef} className="relative flex items-center">
            {/* 
              Desktop: Expandable interaction
              Mobile: We might want it to behave differently or just expand over other elements?
              For now, using the expanding width transition which works well for both if spaced correctly.
            */}
            <div className={`
                flex items-center transition-all duration-300 ease-in-out
                ${isExpanded ? 'w-full md:w-[300px] bg-gray-50 rounded-full border border-gray-200' : 'w-10 bg-transparent border-transparent'}
            `}>
                <button
                    type="button"
                    onClick={handleSearchClick}
                    className={`p-2 hover:text-[#a48354] transition-colors flex-shrink-0 ${isExpanded ? 'text-gray-400' : 'text-black'}`}
                >
                    <Search className="w-5 h-5" strokeWidth={1} />
                </button>

                <form onSubmit={handleSubmit} className={`flex-1 flex items-center overflow-hidden ${isExpanded ? 'opacity-100 visible pr-2' : 'opacity-0 invisible w-0'}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 text-[#171717] placeholder:text-gray-400 font-light focus:outline-none"
                    />
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                    ) : (
                        query && (
                            <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )
                    )}
                </form>
            </div>

            {/* Dropdown Results */}
            {isExpanded && suggestions.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-[calc(100vw-40px)] md:w-[350px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="max-h-[60vh] overflow-y-auto">
                        {suggestions.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => navigateToProduct(product.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                            >
                                <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Search className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#171717] truncate">{product.name}</p>
                                    <p className="text-xs text-[#a48354] mt-0.5">{formatPrice(product.price)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-50 px-3 py-2 text-center border-t border-gray-100">
                        <button onClick={handleSubmit} className="text-xs text-gray-500 hover:text-[#a48354] transition-colors font-medium uppercase tracking-wider">
                            See all results
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
