import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .ilike('name', '%Cosy Warm Fluffy Slippers%') // Filter specifically for these slippers
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-[#232323] text-white text-[11px] py-2.5 text-center tracking-[0.2em] font-sans font-semibold uppercase">
        Free Shipping worldwide
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-100 py-6 px-6 md:px-12 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="hidden md:flex gap-8 text-[13px] tracking-[0.05em] font-sans">
            <Link href="#collection" className="hover:text-[#a48354] transition-colors">SHOP</Link>
            <Link href="#" className="hover:text-[#a48354] transition-colors">ABOUT</Link>
            <Link href="#" className="hover:text-[#a48354] transition-colors">CONTACT</Link>
          </div>

          <Link href="/" className="text-2xl font-serif tracking-widest text-center absolute left-1/2 -translate-x-1/2 uppercase">
            AtelierDouce
          </Link>

          <div className="flex items-center gap-6">
            <button className="hover:text-[#a48354] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="hover:text-[#a48354] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <Image
          src="/hero-home.png"
          alt="Cozy Luxury Home"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <span className="text-sm md:text-base tracking-[0.2em] uppercase mb-4 font-sans drop-shadow-md">
            Premium Home Comfort
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-wide mb-8 drop-shadow-lg">
            Winter <br /><span className="italic">Essentials</span>
          </h1>
          <Link
            href="#collection"
            className="inline-block px-10 py-4 bg-white text-black text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#232323] hover:text-white transition-all duration-300"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-serif mb-6 text-[#171717]">The Art of Comfort</h2>
        <div className="w-12 h-[1px] bg-[#a48354] mx-auto mb-8"></div>
        <p className="text-[#5e5e5e] leading-loose font-light text-[15px]">
          Discover our curated collection of premium home footwear. Designed for those who appreciate
          minimalist aesthetics without compromising on warmth and comfort. Made with the finest materials
          to keep you cozy throughout the winter season.
        </p>
      </section>

      {/* Product Grid */}
      <section id="collection" className="pb-32 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-y-16">
            {products.map((product) => (
              <Link href={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-6">
                  <Image
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* Quick Add Overlay - only visible on hover (desktop) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm flex justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[11px] uppercase tracking-widest font-bold">Quick View</span>
                  </div>

                  {/* Sale Tag */}
                  <div className="absolute top-4 left-4 bg-[#a48354] text-white text-[10px] uppercase font-bold px-3 py-1 tracking-wider">
                    Best Seller
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-[15px] font-serif text-[#171717] group-hover:text-[#a48354] transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-[13px] text-[#5e5e5e] font-sans">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
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
            <h3 className="font-serif text-[#dfe3e8] text-lg uppercase tracking-widest">AtelierDouce</h3>
            <p className="leading-relaxed text-xs">
              Premium menswear & home essentials focused on quality, minimalism, and timeless style.
            </p>
          </div>

          <div>
            <h4 className="text-[#dfe3e8] uppercase tracking-widest text-xs font-bold mb-6">Shop</h4>
            <ul className="space-y-4 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#collection" className="hover:text-white transition-colors">Collection</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">New Arrivals</Link></li>
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
          <p>© {new Date().getFullYear()} AtelierDouce. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
