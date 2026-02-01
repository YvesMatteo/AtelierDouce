'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay slightly to avoid layout shift on initial load
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShowBanner(false);
    };

    const declineCookies = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#171717] text-white p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-center sm:text-left">
                    We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
                    <Link href="/privacy-policy" className="underline hover:text-[#D4AF37]">
                        Learn more
                    </Link>
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={declineCookies}
                        className="px-4 py-2 text-sm border border-white/30 hover:bg-white/10 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={acceptCookies}
                        className="px-4 py-2 text-sm bg-[#D4AF37] text-black font-bold hover:bg-[#c9a44a] transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
