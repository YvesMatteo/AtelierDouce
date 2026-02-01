import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductActions from '@/components/ProductActions';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { headers } from 'next/headers';
import { getCurrencyForCountry, calculatePrice, formatPrice, BASE_PRICE_USD } from '@/lib/currency';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Re-export this to ensure static params are generated correctly if you were using SSG, 
// strictly for now we are using dynamic rendering.

async function getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data;
}

export default async function ProductPage({ params }: PageProps) {
    const { id } = await params;
    const product = await getProduct(id);
    const headersList = await headers();
    const country = headersList.get('x-vercel-ip-country') || 'US';
    const { code, rate, symbol } = getCurrencyForCountry(country);

    if (!product) {
        notFound();
    }

    const basePrice = product.price || BASE_PRICE_USD;
    const price = calculatePrice(basePrice, rate);
    const formattedPrice = formatPrice(price, code);

    // Calculate a fake "compare at" price (e.g. 1.5x)
    const originalPrice = Math.ceil(price * 1.5);
    const formattedOriginalPrice = formatPrice(originalPrice, code);

    return (
        <div className="min-h-screen bg-white text-[#171717]">
            {/* Navigation (Simple) */}
            {/* Navigation (Simple) - REMOVED, using global Sidebar */}

            <div className="pt-12 pb-24 md:pt-20">
                <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Images Column */}
                    <div className="space-y-2">
                        <div className="aspect-[4/5] relative bg-white w-full overflow-hidden">
                            <Image
                                src={product.images?.[0] || '/placeholder.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover scale-[1.15] origin-bottom"
                                priority
                            />
                        </div>
                        {/* Thumbnails grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {product.images?.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="aspect-[4/5] relative bg-white overflow-hidden">
                                    <Image
                                        src={img}
                                        alt={`${product.name} ${idx + 2}`}
                                        fill
                                        className="object-cover scale-[1.15] origin-bottom"
                                    />
                                </div>
                            ))}
                        </div>
                        {product.images && product.images.length > 3 && (
                            <div className="aspect-[4/5] relative bg-white w-full overflow-hidden">
                                <Image
                                    src={product.images[3]}
                                    alt={`${product.name} 4`}
                                    fill
                                    className="object-cover scale-[1.15] origin-bottom"
                                />
                            </div>
                        )}
                    </div>

                    {/* Product Info Column (Sticky) */}
                    <div className="lg:sticky lg:top-32 h-fit">
                        <div className="mb-4">
                            <span className="text-[#a48354] text-xs font-bold uppercase tracking-widest mb-2 block">
                                New Arrival
                            </span>
                            <h1 className="text-4xl lg:text-5xl font-serif font-normal mb-6 leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4 border-b border-dashed border-gray-200 pb-8">
                                <span className="text-xl font-sans text-[#171717]">
                                    {formattedPrice}
                                </span>
                                {/* Optional: Compare price */}
                                <span className="text-lg text-[#959595] line-through font-light">
                                    {formattedOriginalPrice}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-sm prose-stone mb-8 max-w-none text-[#5e5e5e] font-sans font-light leading-7">
                            <p>{product.description}</p>
                            <ul className="list-disc pl-5 space-y-1 mt-4">
                                <li>Premium quality materials</li>
                                <li>Designed for maximum comfort</li>
                                <li>Durable and long-lasting</li>
                            </ul>
                        </div>

                        {/* Controls */}
                        <ProductActions
                            product={product}
                            currentPrice={price}
                            currencyCode={code}
                        />

                        {/* Accordions / Extra Info */}
                        <div className="mt-12 border-t border-gray-100">
                            {[
                                {
                                    title: 'Shipping & Returns',
                                    content: (
                                        <div className="space-y-2">
                                            <p>
                                                We offer worldwide shipping. <Link href="/shipping-policy" className="underline hover:text-[#171717]">View Shipping Policy</Link>
                                            </p>
                                            <p>
                                                <Link href="/return-policy" className="underline hover:text-[#171717]">View Return Policy</Link>
                                            </p>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Materials & Care',
                                    content: (
                                        <p>Premium cotton blend. Hand wash only.</p>
                                    )
                                },
                            ].map((item, i) => (
                                <div key={i} className="border-b border-gray-100 py-4 group cursor-pointer">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[13px] uppercase font-bold tracking-wider">{item.title}</h4>
                                        <span className="text-lg font-light text-[#959595] group-hover:text-[#171717]">+</span>
                                    </div>
                                    <div className="hidden group-hover:block pt-2 text-sm text-[#5e5e5e]">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
