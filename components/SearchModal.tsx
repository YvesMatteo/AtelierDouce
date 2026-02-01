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

const SearchResultItem = ({ product, isSelected, onClick, formatPrice }: {
    product: Product;
    isSelected: boolean;
    onClick: () => void;
    formatPrice: (price: number) => string;
}) => {
    const [imageError, setImageError] = useState(false);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 text-left transition-all duration-150 ${isSelected
                ? 'bg-[#f8f5f0]'
                : 'hover:bg-gray-50'
                } border-b border-gray-50 last:border-0 group`}
        >
            <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                {!imageError && product.images?.[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="64px"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <Search className="w-6 h-6 opacity-50" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#171717] truncate tracking-wide group-hover:text-[#a48354] transition-colors">
                    {product.name}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                    {product.category}
                </p>
                <p className="text-sm text-[#a48354] mt-1 font-medium">
                    {formatPrice(product.price)}
                </p>
            </div>
            <svg
                className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-[#a48354]' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
};

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
            // Small delay to ensure modal is mounted and transition started
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
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
            // Prevent scrolling on body when modal is open
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
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                navigateToProduct(suggestions[selectedIndex].id);
            } else {
                handleSubmit(e);
            }
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

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-24 px-4">
            {/* Backdrop - lighter and more elegant */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col max-h-[90vh]">
                {/* Search Input Card */}
                <div className="bg-white rounded-xl shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-black/5 flex flex-col max-h-full">
                    <form onSubmit={handleSubmit} className="flex-none flex items-center border-b border-gray-100 p-2 sm:p-3 relative z-10 bg-white">
                        <Search className="w-5 h-5 ml-3 text-gray-400" strokeWidth={1.5} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What are you looking for?"
                            className="flex-1 px-4 py-3 text-[16px] font-light text-[#171717] placeholder:text-gray-400 focus:outline-none bg-transparent tracking-wide"
                            autoComplete="off"
                            name="search_query_mobile"
                        />
                        {isLoading ? (
                            <div className="w-5 h-5 mr-3 border-2 border-gray-200 border-t-[#a48354] rounded-full animate-spin" />
                        ) : (
                            query && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                    className="p-2 mr-1 text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={2} />
                                </button>
                            )
                        )}
                        <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-[#171717] transition-colors rounded-lg hover:bg-gray-50 bg-transparent"
                        >
                            <span className="hidden sm:inline text-sm font-medium">ESC</span>
                            <X className="w-5 h-5 sm:hidden" strokeWidth={1.5} />
                        </button>
                    </form>

                    {/* Suggestions Dropdown */}
                    <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
                        {suggestions.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {suggestions.map((product, index) => (
                                    <SearchResultItem
                                        key={product.id}
                                        product={product}
                                        isSelected={index === selectedIndex}
                                        onClick={() => navigateToProduct(product.id)}
                                        formatPrice={formatPrice}
                                    />
                                ))}
                            </div>
                        ) : query.length >= 2 && !isLoading && (
                            <div className="px-5 py-12 text-center text-gray-500">
                                <Search className="w-8 h-8 mx-auto text-gray-300 mb-3" strokeWidth={1} />
                                <p className="text-[15px]">No products found for "{query}"</p>
                                <p className="text-gray-400 text-sm mt-1">Try checking for typos or using different keywords</p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint - Desktop only */}
                    <div className="hidden sm:flex flex-none px-5 py-3 bg-gray-50/80 border-t border-gray-100 justify-between items-center text-[11px] font-medium text-gray-400 tracking-wide uppercase select-none">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5">
                                <kbd className="min-w-[20px] h-5 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-500 font-sans text-[10px]">↑↓</kbd>
                                to navigate
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="min-w-[20px] h-5 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-500 font-sans text-[10px]">↵</kbd>
                                to select
                            </span>
                        </div>
                        <span className="flex items-center gap-1.5">
                            <kbd className="min-w-[28px] h-5 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-500 font-sans text-[10px]">ESC</kbd>
                            to close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

