'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/?search=${encodeURIComponent(query.trim())}`);
            onClose();
            setQuery('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 md:pt-32">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleSubmit} className="flex items-center">
                    <Search className="w-5 h-5 ml-6 text-gray-400" strokeWidth={1.5} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 px-4 py-5 text-lg font-light text-[#171717] placeholder:text-gray-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-4 hover:text-[#a48354] transition-colors"
                    >
                        <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </form>

                <div className="px-6 pb-4 text-xs text-gray-400">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> to search or <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Esc</kbd> to close
                </div>
            </div>
        </div>
    );
}
