'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';

import { formatPrice } from '@/lib/currency';

interface StickyNewsletterProps {
    rate?: number;
    code?: string;
}

export default function StickyNewsletter({ rate = 1, code = 'USD' }: StickyNewsletterProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Show after scrolling down a bit
        const handleScroll = () => {
            if (window.scrollY > 300 && !isDismissed) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDismissed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error('Unspecified error');

            setStatus('success');
            setTimeout(() => {
                setIsDismissed(true);
                setIsVisible(false);
            }, 3000);
        } catch (err) {
            setStatus('error');
        }
    };

    if (!isVisible && status !== 'success') return null;
    if (isDismissed) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-gray-200 bg-[#faf2e6] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out transform translate-y-0">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">

                {/* Close Button */}
                <button
                    onClick={() => { setIsDismissed(true); setIsVisible(false); }}
                    className="absolute top-0 right-0 md:top-auto md:right-[-20px] text-gray-400 hover:text-gray-900"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="hidden md:flex justify-center items-center w-12 h-12 bg-[#171717] rounded-full text-white shrink-0">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif text-xl text-[#171717]">Join Our Community</h3>
                        <p className="text-sm text-[#5e5e5e] mt-1">
                            Sign up for our newsletter and get <span className="font-semibold text-[#a48354]">{formatPrice(5 * rate, code)} OFF</span> your first order.
                        </p>
                    </div>
                </div>

                {status === 'success' ? (
                    <div className="bg-[#171717] text-white px-8 py-3 rounded text-sm font-medium animate-fade-in flex flex-col items-start gap-1">
                        <span>Check your inbox! 💌</span>
                        <span className="text-[10px] opacity-75 italic">(Check spam if missing)</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 md:w-64 bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#a48354] transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="bg-[#171717] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#a48354] transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? '...' : 'Subscribe'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
