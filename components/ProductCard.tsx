
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { calculatePrice, formatPrice } from '@/lib/currency';

interface ProductCardProps {
    product: Product;
    rate: number;
    code: string;
}

export default function ProductCard({ product, rate, code }: ProductCardProps) {
    // Calculate price based on location
    const price = calculatePrice(product.price, rate);
    const formattedPrice = formatPrice(price, code);

    return (
        <Link href={`/product/${product.id}`} className="group cursor-pointer block h-full">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-6 p-3">
                <Image
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                {/* Quick Add Overlay - only visible on hover (desktop) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm flex justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[11px] uppercase tracking-widest font-bold">Quick View</span>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-[15px] font-serif text-[#171717] group-hover:text-[#a48354] transition-colors duration-300">
                    {product.name}
                </h3>
                <p className="text-[13px] text-[#5e5e5e] font-sans">
                    {formattedPrice}
                </p>
            </div>
        </Link>
    );
}
