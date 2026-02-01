'use client';

import { useState } from 'react';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setStatus('success');
            setEmail('');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    return (
        <section id="newsletter" className="py-32 bg-[#faf2e6] scroll-mt-24">
            <div className="max-w-2xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-serif mb-6">Join Our Community</h2>
                <p className="text-[#5e5e5e] text-lg mb-10 leading-relaxed">
                    Sign up for our newsletter and get a <span className="font-semibold text-[#a48354]">$5 gift card</span>.
                </p>

                {status === 'success' ? (
                    <div className="bg-[#171717] text-white p-6 rounded-md">
                        <p className="font-serif text-lg mb-2">Check your email!</p>
                        <p className="text-sm opacity-80">
                            We've sent a confirmation link to your inbox. Please click it to verify your email and receive your discount code.
                        </p>
                        <p className="text-xs text-white/60 mt-4 italic">
                            (If you don't see it, please check your spam folder)
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent border-b border-[#171717]/20 py-3 px-2 text-center text-sm focus:outline-none focus:border-[#171717] transition-colors disabled:opacity-50"
                            disabled={status === 'loading'}
                        />
                        {status === 'error' && (
                            <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                        )}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="mt-4 px-10 py-4 bg-[#171717] text-white text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#a48354] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
