"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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
    <div className="relative bg-white cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-500 border border-black/10 rounded-xl md:rounded-2xl flex flex-col overflow-hidden h-auto md:h-[500px]">
      <div className="relative w-full h-[180px] md:h-[60%] bg-surface/50 transition-colors duration-500 group-hover:bg-surface flex items-center justify-center">
        <FavoriteButton 
          product={product}
          className="z-20 m-4 md:m-6"
        />
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" />
        
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes={getImageSizes('card')}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover mix-blend-multiply transition-transform duration-700 ease-out z-0 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-accent/20 text-6xl z-0">
            متجرنا
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 text-center bg-white z-20 border-t border-black/5 relative">
        <h3 className="text-base md:text-2xl font-black text-foreground mb-0.5 md:mb-1">{product.name}</h3>
        <p className="text-accent text-[9px] md:text-[10px] tracking-[0.2em] uppercase mb-2 md:mb-4">
          {product.engName || product.brand || 'Featured product'}
        </p>
        
        <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-6">
          <p className="text-brand font-bold text-sm md:text-lg">{Number(product.price).toLocaleString('ar-SA')} {currency}</p>
          {product.compareAtPrice && (
            <p className="text-foreground/40 line-through text-[10px] md:text-sm">
              {Number(product.compareAtPrice).toLocaleString('ar-SA')}
            </p>
          )}
        </div>
        
        <button 
          onClick={handleAddToCart}
          className="w-full max-w-full md:max-w-[200px] h-8 md:h-10 border border-brand text-brand hover:bg-brand hover:text-surface transition-colors rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs"
        >
          <ShoppingBag size={13} className="md:w-4 md:h-4" />
          أضف للسلة
        </button>
      </div>
    </div>
  );
}
