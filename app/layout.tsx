import type { Metadata } from 'next';
import { Ovo, Nunito_Sans } from 'next/font/google';
import './globals.css';

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
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ovo.variable} ${nunitoSans.variable}`}>
      <body className="font-sans antialiased text-[#171717] bg-white">{children}</body>
    </html>
  );
}
