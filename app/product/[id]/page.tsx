import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BuyButton from '@/components/BuyButton';
import Link from 'next/link';
import { Product } from '@/lib/types';

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

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white text-[#171717]">
            {/* Navigation (Simple) */}
            <nav className="border-b border-gray-100 py-6 px-6 md:px-12">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <Link href="/" className="text-2xl font-serif tracking-widest text-center uppercase hover:text-[#a48354] transition-colors">
                        AtelierDouce
                    </Link>
                    <Link href="/" className="text-[13px] tracking-[0.05em] font-sans uppercase font-bold hover:text-[#a48354] transition-colors">
                        Close
                    </Link>
                </div>
            </nav>

            <div className="pt-12 pb-24 md:pt-20">
                <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Images Column */}
                    <div className="space-y-2">
                        <div className="aspect-[4/5] relative bg-[#f5f5f5] w-full">
                            <Image
                                src={product.images?.[0] || '/placeholder.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        {/* Thumbnails grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {product.images?.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="aspect-[4/5] relative bg-[#f5f5f5]">
                                    <Image
                                        src={img}
                                        alt={`${product.name} ${idx + 2}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        {product.images && product.images.length > 3 && (
                            <div className="aspect-[4/5] relative bg-[#f5f5f5] w-full">
                                <Image
                                    src={product.images[3]}
                                    alt={`${product.name} 4`}
                                    fill
                                    className="object-cover"
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
                                    ${product.price.toFixed(2)}
                                </span>
                                {/* Optional: Compare price */}
                                <span className="text-lg text-[#959595] line-through font-light">
                                    ${(product.price * 1.5).toFixed(2)}
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
                        <div className="space-y-6">
                            {/* Color (if there were other color products, we could link them here) */}
                            {/* Size Selector */}
                            {product.options && product.options.find(o => o.name === 'Size') && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[13px] font-bold uppercase tracking-wider text-[#171717]">
                                            Size
                                        </label>
                                        <button className="text-[11px] underline text-[#5e5e5e] hover:text-[#171717]">
                                            Size Guide
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.options.find(o => o.name === 'Size')?.values.map((val) => (
                                            <button
                                                key={val}
                                                className="h-10 px-6 border border-[#e5e5e5] text-sm hover:border-[#171717] hover:bg-[#171717] hover:text-white transition-all duration-200 min-w-[3rem]"
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart / Buy Buttons */}
                            <div className="pt-4 space-y-3">
                                <BuyButton
                                    productId={product.id}
                                    productName={product.name}
                                    price={product.price}
                                    image={product.images?.[0] || ''}
                                />
                                <p className="text-[11px] text-[#5e5e5e] text-center pt-2">
                                    Free shipping on all orders over $100.
                                </p>
                            </div>
                        </div>

                        {/* Accordions / Extra Info */}
                        <div className="mt-12 border-t border-gray-100">
                            {[
                                { title: 'Shipping & Returns', content: 'Free worldwide shipping. 30-day return policy.' },
                                { title: 'Materials & Care', content: 'Premium cotton blend. Hand wash only.' },
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
