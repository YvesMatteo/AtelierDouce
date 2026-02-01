import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { headers } from 'next/headers';
import { getCurrencyForCountry, calculatePrice, formatPrice } from '@/lib/currency';
import ProductCarousel from '@/components/ProductCarousel';
import ProductGrid from '@/components/ProductGrid';

// ... imports

interface HomeProps {
  searchParams: Promise<{ category?: string; gender?: string; search?: string; sort?: string }>;
}

async function getProducts(gender?: string, category?: string, search?: string): Promise<Product[]> {
  const FEATURED_IDS = [
    '01f0b84d-c345-46a7-b2ec-d321df601c8c', // Luxe Fox Fur Ear Warmers
    'a4ff2c89-d821-434f-8578-817075daccf8', // Soft Fit Knit Coat
    'd9e478e7-2e72-4b34-987f-7fed63572326', // Brushed Fleece Leggings
    'd1cf713c-5d86-4537-a5a4-8d7f4927f672', // Winter Ski Suit (described as White in previous context, checking match)
  ];

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  // If we are just loading the main page (no filters), we want to prioritize our featured items
  // However, Supabase doesn't support custom sorting by array index easily in one query without a stored procedure
  // So we will just fetch everything (or a reasonable limit) and sort in JS, OR
  // we can fetch the featured ones separately if needed.
  // For simplicity and performance on a small catalog, let's stick to the current query
  // but if no filters are present, we'll manually reorder the results.

  // Actually, to ensure they appear even if created dates change, let's use the default sort
  // and then post-process if it's the main "New Arrivals" view.

  query = query
    .order('category', { ascending: true })
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

  let products = data || [];

  // If no filters are active (Main Landing Page "New Arrivals") or "Shop All" is selected, prioritize the featured items
  if (!gender && (!category || category === 'All') && !search) {
    const featured = [];
    const others = [];

    // Create a map for fast lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Extract featured items in order
    for (const id of FEATURED_IDS) {
      const p = productMap.get(id);
      if (p) {
        featured.push(p);
        productMap.delete(id); // Remove so we don't add it to others
      }
    }

    // Add remaining items
    for (const p of products) {
      if (!FEATURED_IDS.includes(p.id)) {
        others.push(p);
      }
    }

    products = [...featured, ...others];
  }

  return products;
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const { category, gender, search, sort } = searchParams;

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
        <section className="py-12 px-6 md:px-12 max-w-3xl mx-auto text-center">
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

          {(!category && !search && !gender && !sort) ? (
            <ProductCarousel products={products.slice(0, 4)} rate={rate} code={code} />
          ) : (
            <ProductGrid products={products} rate={rate} code={code} />
          )}

          {(!category && !sort) && (
            <div className="flex justify-center mt-12">
              <Link
                href="/?category=All"
                className="px-10 py-4 bg-[#171717] text-white text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-[#a48354] transition-colors duration-300"
              >
                Shop All
              </Link>
            </div>
          )}
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

    </main>
  );
}
