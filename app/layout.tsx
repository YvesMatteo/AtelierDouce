import type { Metadata } from 'next';
import { Ovo, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Sidebar from '@/components/Sidebar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import TikTokPixel from '@/components/TikTokPixel';
import AnnouncementBar from '@/components/AnnouncementBar';

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
          <AnnouncementBar />
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
      </body>
    </html>
  );
}
