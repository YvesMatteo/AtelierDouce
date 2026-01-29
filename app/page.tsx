import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { headers } from 'next/headers';
import { getCurrencyForCountry, calculatePrice, formatPrice, BASE_PRICE_USD } from '@/lib/currency';
import ProductCarousel from '@/components/ProductCarousel';

// ... imports

interface HomeProps {
  searchParams: Promise<{ category?: string; gender?: string; search?: string }>;
}

async function getProducts(gender?: string, category?: string, search?: string): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (gender) {
    query = query.eq('gender', gender);
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const { category, gender, search } = searchParams;

  const products = await getProducts(gender, category, search);
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country') || 'US';
  const { code, rate } = getCurrencyForCountry(country);

  // Dynamic Title Construction
  let title = 'Aprés Ski Essentials';
  let subtitle = 'Alpine Luxury & Comfort';

  if (search) {
    title = `Results for "${search}"`;
    subtitle = `${products.length} product${products.length !== 1 ? 's' : ''} found`;
  } else if (gender) {
    subtitle = `${gender}'s Collection`;
    title = category ? category : 'New Arrivals';
  } else if (category) {
    title = category === 'All' ? 'All Products' : category;
  }



  return (
    <main className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[85vh] w-full overflow-hidden">
        <Image
          src="/hero-home-new.png"
          alt="Cozy Luxury Home"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center text-white p-6 pb-32">
          <span className="text-sm md:text-base tracking-[0.2em] uppercase mb-4 font-sans drop-shadow-md">
            {subtitle}
          </span>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif tracking-wide mb-8 drop-shadow-lg">
            {title === 'New Arrivals' ? <>New <br /><span className="italic">Arrivals</span></> : title}
          </h1>
        </div>
      </section>

      {/* Introduction */}
      {!category && (
        <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 relative z-10">
            The Art of Bourgeois
          </h1>
          <div className="w-12 h-[1px] bg-[#a48354] mx-auto mb-8"></div>
          <p className="text-[#5e5e5e] leading-loose font-light text-[15px]">
            Discover our curated collection of premium accessories and winter wear. Designed for those who appreciate
            minimalist aesthetics without compromising on warmth and comfort.
          </p>
        </section>
      )}

      {/* Product Grid */}
      <section id="collection" className="py-12 md:pb-32 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="text-2xl font-serif">{category ? category : 'Latest Arrivals'}</h2>
            <span className="text-sm text-[#5e5e5e]">{products.length} products</span>
          </div>

          <ProductCarousel products={products} rate={rate} code={code} />

          <div className="flex justify-center mt-12">
            <Link
              href="/?category=All"
              className="px-10 py-4 bg-[#171717] text-white text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#a48354] transition-colors duration-300"
            >
              Shop All
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-[#faf2e6]">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-serif mb-4">Join Our Community</h2>
          <p className="text-[#5e5e5e] text-sm mb-8 leading-relaxed">
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>
          <form className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email address"
              className="bg-transparent border-b border-[#171717]/20 py-3 px-2 text-center text-sm focus:outline-none focus:border-[#171717] transition-colors"
            />
            <button className="mt-4 px-10 py-4 bg-[#171717] text-white text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#a48354] transition-colors duration-300">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#211e1e] text-[#897a64] py-16 px-6 md:px-12 text-sm font-sans">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <h3 className="font-serif text-[#dfe3e8] text-lg uppercase tracking-widest">Atelier Douce</h3>
            <p className="leading-relaxed text-xs">
              Premium home essentials focused on quality, minimalism, and timeless style.
            </p>
          </div>

          <div>
            <h4 className="text-[#dfe3e8] uppercase tracking-widest text-xs font-bold mb-6">Shop</h4>
            <ul className="space-y-4 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/?category=Woman" className="hover:text-white transition-colors">Woman</Link></li>
              <li><Link href="/?category=Accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#dfe3e8] uppercase tracking-widest text-xs font-bold mb-6">Customer Care</h4>
            <ul className="space-y-4 text-xs">
              <li><Link href="#" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#dfe3e8] uppercase tracking-widest text-xs font-bold mb-6">Payments</h4>
            <div className="flex gap-2 grayscale opacity-50">
              {/* Payment icons placeholders */}
              <div className="w-10 h-6 bg-white rounded"></div>
              <div className="w-10 h-6 bg-white rounded"></div>
              <div className="w-10 h-6 bg-white rounded"></div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} Atelier Douce. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
