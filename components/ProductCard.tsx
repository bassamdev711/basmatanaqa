"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Share2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { useCart } from './CartProvider';
import { useToast } from './ToastProvider';
import { getImageSizes } from '@/lib/image-utils';
import WhatsAppIcon from './icons/WhatsAppIcon';
import { getProductWhatsAppLink } from '@/lib/whatsapp-order';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortCode?: string | null;
    price: number;
    compareAtPrice: number | null;
    imageUrl: string;
    engName?: string;
    brand?: string;
    collectionName?: string | null;
    subCategoryName?: string | null;
    isNew48h?: boolean;
    hasSizes?: boolean;
    availableSizes?: string[];
  };
  currency: string;
  priority?: boolean;
}

export default function ProductCard({ product, currency, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const code = product.shortCode || product.slug;
    const shortUrl = `${window.location.origin}/p/${code}`;

    const lines = [
      '✨ متجر شهرزاد ✨',
      `🛍️ المنتج: ${product.name}`,
      `💰 السعر: ${product.price} ${currency}`,
      '',
      '🔗 رابط وتفاصيل المنتج:',
      shortUrl,
    ];
    const shareText = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | متجر شهرزاد`,
          text: shareText,
        });
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.log('Error sharing', err);
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('success', 'تم نسخ تفاصيل ورابط المنتج بنجاح!');
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

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasSizes) {
      showToast('info', 'يرجى اختيار المقاس أولاً من صفحة المنتج');
      router.push(`/products/${product.slug}`);
      return;
    }
    const url = getProductWhatsAppLink({
      name: product.name,
      price: product.price,
      currency,
      quantity: 1,
      slug: product.slug,
      shortCode: product.shortCode,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="relative bg-white cursor-pointer group transition-all duration-300 rounded-xl md:rounded-2xl flex flex-col overflow-hidden h-full border border-black/5 hover:border-black/10">
      {/* Top badges & buttons */}
      <div className="absolute top-2 md:top-4 w-full px-2 md:px-4 flex justify-between items-start z-20 pointer-events-none">
        {/* Badges Container */}
        <div className="flex flex-col gap-1 items-start">
          {/* Discount Badge */}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <div className="bg-red-500/90 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-md pointer-events-auto shadow-sm">
              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </div>
          )}
          {/* New in 48h Badge */}
          {product.isNew48h && (
            <div className="bg-brand text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md pointer-events-auto shadow-sm flex items-center gap-1">
              <span>✨</span>
              <span>جديد اليومين</span>
            </div>
          )}
        </div>
        
        {/* Buttons Wrapper */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Wishlist Button */}
          <FavoriteButton 
            product={product}
            className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
          />
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
        {/* Category: SubCategory first, then Collection, then brand/engName */}
        <div className="flex items-center gap-1.5 mb-1 line-clamp-1">
          {product.subCategoryName ? (
            <span className="text-brand font-bold text-[10px] md:text-xs tracking-wide">
              {product.subCategoryName}
              {product.collectionName && (
                <span className="text-black/30 font-normal mr-1.5">({product.collectionName})</span>
              )}
            </span>
          ) : product.collectionName ? (
            <span className="text-brand/90 font-medium text-[10px] md:text-xs tracking-wide">
              {product.collectionName}
            </span>
          ) : (
            <span className="text-black/50 text-[10px] md:text-xs tracking-wider uppercase">
              {product.brand || product.engName || 'منتج مميز'}
            </span>
          )}
        </div>
        
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
        
        {/* Action Buttons - Visible on mobile, hover on desktop */}
        <div className="mt-auto flex gap-2">
          <button 
            onClick={handleAddToCart}
            className="flex-1 py-2 bg-brand text-white md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 hover:bg-brand-hover transition-all duration-300 rounded-md flex items-center justify-center gap-1.5 font-medium text-xs md:text-sm shadow-sm"
          >
            <ShoppingBag size={14} className="opacity-80" />
            <span>السلة</span>
          </button>
          <button 
            onClick={handleWhatsAppClick}
            className="flex-1 py-2 bg-[#25D366] text-white md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 hover:bg-[#1EBE5D] transition-all duration-300 rounded-md flex items-center justify-center gap-1.5 font-bold text-xs md:text-sm shadow-sm"
            title="اطلب عبر واتساب"
          >
            <WhatsAppIcon size={15} />
            <span>واتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
