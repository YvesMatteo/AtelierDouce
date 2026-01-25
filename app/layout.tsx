import type { Metadata } from 'next';
import { Ovo, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';

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
  title: 'AtelierDouce | Premium Comfort',
  description: 'Premium slippers and home footwear.',

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
          <Header />
          <CartDrawer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
