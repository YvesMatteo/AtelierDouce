import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Ovo, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Sidebar from '@/components/Sidebar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import TikTokPixel from '@/components/TikTokPixel';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsent from '@/components/CookieConsent';
// import AnnouncementBar from '@/components/AnnouncementBar';

const ovo = Ovo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ovo',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atelier Douce | Premium Comfort',
  description: 'Premium winter wear, accessories, and home footwear. Discover luxury and comfort with Atelier Douce.',
  openGraph: {
    title: 'Atelier Douce | Premium Comfort',
    description: 'Premium winter wear, accessories, and home footwear. Discover luxury and comfort with Atelier Douce.',
    url: 'https://atelierdouce.shop',
    siteName: 'Atelier Douce',
    images: [
      {
        url: 'https://atelierdouce.shop/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Atelier Douce - Premium Comfort',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atelier Douce | Premium Comfort',
    description: 'Premium winter wear, accessories, and home footwear.',
    images: ['https://atelierdouce.shop/og-image.jpg'],
  },
  metadataBase: new URL('https://atelierdouce.shop'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ovo.variable} ${nunitoSans.variable}`}>
      <body className="font-sans antialiased text-[#171717] bg-white">
        <Providers>
          {/* <AnnouncementBar /> */}
          <Sidebar />
          <CartDrawer />
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
        <TikTokPixel />
        <GoogleAnalytics />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}

