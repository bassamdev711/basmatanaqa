"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Share2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { useCart } from './CartProvider';
import { useToast } from './ToastProvider';
import { getImageSizes } from '@/lib/image-utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    imageUrl: string;
    engName?: string;
    brand?: string;
  };
  currency: string;
  priority?: boolean;
}

export default function ProductCard({ product, currency, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/products/${product.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `شاهد ${product.name} على متجرنا!`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      showToast('success', 'تم نسخ الرابط بنجاح!');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      maxStock: 99, // default max stock if not provided
    });
    showToast('success', 'تمت الإضافة إلى السلة بنجاح');
  };

  return (
    <div className="relative bg-white cursor-pointer group transition-all duration-300 rounded-xl md:rounded-2xl flex flex-col overflow-hidden h-full border border-black/5 hover:border-black/10">
      {/* Top badges & buttons */}
      <div className="absolute top-2 md:top-4 w-full px-2 md:px-4 flex justify-between items-start z-20 pointer-events-none">
        {/* Discount Badge */}
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <div className="bg-red-500/90 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-md pointer-events-auto shadow-sm">
            -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
          </div>
        ) : <div />}
        
        {/* Buttons Wrapper */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Wishlist Button */}
          <FavoriteButton 
            product={product}
            className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
          />
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform flex items-center justify-center text-black/60 hover:text-black"
            title="مشاركة"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-[3/4] bg-[#f9f9f9] transition-colors duration-500 flex items-center justify-center overflow-hidden">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" />
        
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes={getImageSizes('card')}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover transition-transform duration-700 ease-out z-0 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/10 text-4xl z-0 font-black">
            متجرنا
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 md:p-4 bg-white z-20 relative text-right">
        {/* Brand / Category */}
        <p className="text-black/50 text-[10px] md:text-xs tracking-wider uppercase mb-1 line-clamp-1">
          {product.brand || product.engName || 'منتج مميز'}
        </p>
        
        {/* Title */}
        <h3 className="text-sm md:text-base font-medium text-black mb-2 line-clamp-2 md:line-clamp-1 group-hover:text-brand transition-colors">
          {product.name}
        </h3>
        
        {/* Prices */}
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          <p className="text-black font-bold text-sm md:text-lg">
            {Number(product.price).toLocaleString('ar-SA')} {currency}
          </p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-black/40 line-through text-[10px] md:text-sm">
              {Number(product.compareAtPrice).toLocaleString('ar-SA')}
            </p>
          )}
        </div>
        
        {/* Add to Cart - Visible on mobile, hover on desktop */}
        <div className="mt-auto">
          <button 
            onClick={handleAddToCart}
            className="w-full py-2 border border-black/10 text-black md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 hover:bg-black hover:text-white transition-all duration-300 rounded-md flex items-center justify-center gap-2 font-medium text-xs md:text-sm"
          >
            <ShoppingBag size={14} className="opacity-70" />
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
