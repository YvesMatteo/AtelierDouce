'use client';

import Link from 'next/link';

export default function AnnouncementBar() {
    const scrollToNewsletter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const element = document.getElementById('newsletter');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-black text-white text-center py-2.5 px-4 text-[12px] md:text-[13px] tracking-wide relative z-50">
            <p>
                Sign up for our{' '}
                <a
                    href="#newsletter"
                    onClick={scrollToNewsletter}
                    className="underline font-semibold hover:text-[#a48354] transition-colors cursor-pointer"
                >
                    newsletter
                </a>{' '}
                and get a $5 gift card
            </p>
        </div>
    );
}
