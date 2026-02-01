'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { trackSearch } = useTikTokPixel();

    // Debounced search
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
                .limit(6);

            if (!error && data) {
                setSuggestions(data);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchProducts]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setSuggestions([]);
            setSelectedIndex(-1);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            navigateToProduct(suggestions[selectedIndex].id);
        }
    };

    const navigateToProduct = (productId: string) => {
        router.push(`/product/${productId}`);
        onClose();
        setQuery('');
        setSuggestions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            trackSearch(query.trim());
            router.push(`/?search=${encodeURIComponent(query.trim())}`);
            onClose();
            setQuery('');
            setSuggestions([]);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF',
        }).format(price);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-24">
            {/* Backdrop with elegant blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-xl mx-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Search Input Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20 overflow-hidden">
                    <form onSubmit={handleSubmit} className="flex items-center border-b border-gray-100">
                        <Search className="w-5 h-5 ml-5 text-[#a48354]" strokeWidth={1.5} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search our collection..."
                            className="flex-1 px-4 py-4 text-base font-light text-[#171717] placeholder:text-gray-400 focus:outline-none bg-transparent tracking-wide"
                        />
                        {isLoading && (
                            <div className="w-5 h-5 mr-2 border-2 border-[#a48354]/30 border-t-[#a48354] rounded-full animate-spin" />
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-4 text-gray-400 hover:text-[#a48354] transition-colors"
                        >
                            <X className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <div className="max-h-[400px] overflow-y-auto">
                            {suggestions.map((product, index) => (
                                <button
                                    key={product.id}
                                    onClick={() => navigateToProduct(product.id)}
                                    className={`w-full flex items-center gap-4 p-4 text-left transition-all duration-150 ${index === selectedIndex
                                        ? 'bg-[#f8f5f0]'
                                        : 'hover:bg-gray-50'
                                        } ${index !== suggestions.length - 1 ? 'border-b border-gray-50' : ''}`}
                                >
                                    {/* Product Image */}
                                    <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                        {product.images?.[0] ? (
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Search className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#171717] truncate tracking-wide">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">
                                            {product.category}
                                        </p>
                                        <p className="text-sm text-[#a48354] mt-1 font-medium">
                                            {formatPrice(product.price)}
                                        </p>
                                    </div>

                                    {/* Arrow indicator */}
                                    <svg
                                        className="w-4 h-4 text-gray-300 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {query.length >= 2 && !isLoading && suggestions.length === 0 && (
                        <div className="px-5 py-8 text-center">
                            <p className="text-gray-400 text-sm">No products found for "{query}"</p>
                            <p className="text-gray-300 text-xs mt-1">Try a different search term</p>
                        </div>
                    )}

                    {/* Footer hint */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 mr-1">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 mr-1">↓</kbd>
                                to navigate
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 mr-1">Enter</kbd>
                                to select
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 mr-1">Esc</kbd>
                                to close
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
