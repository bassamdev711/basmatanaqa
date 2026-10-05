"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, CreditCard, Minus, Plus, Sparkles, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { getImageSizes } from '@/lib/image-utils';
import { useCartAnimation } from './CartAnimationProvider';
import { useToast } from './ToastProvider';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/components/CurrencyProvider'
import { useFavorites } from './FavoritesProvider';

interface ProductVariant {
  id: string
  size: string
  price: number
  compareAtPrice: number | null
  stock: number
}

interface ProductItem {
  id: string
  name: string
  engName: string
  description: string
  price: string
  code: string
  color: string
  size: string
  gender: string
  gradient: string
  image: string
  images: string[]
  slug: string
  rawPrice?: number
  compareAtPrice?: number
  stock: number
  variants: ProductVariant[]
}

/* ─── Detail Modal ─────────────────────────────────────────── */
function DetailModal({ product, onClose }: { product: ProductItem; onClose: () => void }) {
  const currency = useCurrency();
  const router = useRouter();
  const { addToCart } = useCart();
  const { flyToCart } = useCartAnimation();
  const { showToast } = useToast();

  const allImages = [product.image, ...product.images].filter(Boolean);
  const [activeImage, setActiveImage] = useState(allImages[0] || '');

  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant ? selectedVariant.price : (product.rawPrice ?? 0);
  const currentCompareAtPrice = selectedVariant
    ? selectedVariant.compareAtPrice
    : (product.compareAtPrice ?? null);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const hasDiscount = currentCompareAtPrice && currentCompareAtPrice > currentPrice;
  const discountPct = hasDiscount
    ? Math.round(((currentCompareAtPrice! - currentPrice) / currentCompareAtPrice!) * 100)
    : 0;

  const doAddToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (currentStock <= 0) {
      showToast('error', 'نعتذر، هذا المنتج نفد من المخزون.');
      return false;
    }
    if (quantity > currentStock) {
      showToast('error', `عذراً، المتوفر في المخزون هو ${currentStock} فقط.`);
      return false;
    }
    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: selectedVariant ? `${product.name} (${selectedVariant.size})` : product.name,
      slug: product.slug,
      price: currentPrice,
      imageUrl: product.image,
      quantity,
      maxStock: currentStock,
    });
    if (e?.currentTarget) flyToCart(e.currentTarget);
    return true;
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => { doAddToCart(e); };
  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    const ok = doAddToCart(e);
    if (ok) { onClose(); router.push('/checkout'); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    navigator.clipboard.writeText(url);
    showToast('success', 'تم نسخ رابط المنتج بنجاح');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full md:max-w-5xl max-h-[95dvh] bg-surface md:rounded-2xl overflow-y-auto no-scrollbar shadow-2xl flex flex-col md:flex-row"
        dir="rtl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-[110] bg-white/80 backdrop-blur text-foreground/60 hover:text-foreground p-2 rounded-full transition-colors shadow"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-5/12 flex flex-col gap-3 bg-white p-4 md:p-6 shrink-0">
          <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden border border-black/5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative w-full h-full"
              >
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    sizes={getImageSizes('detail')}
                    className="object-contain p-6 mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-accent/20" />
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow z-10">
                    وفر {discountPct}%
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 justify-center">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-14 h-14 bg-white border shrink-0 rounded-lg overflow-hidden transition-all ${
                    activeImage === img
                      ? 'border-brand scale-105 shadow-sm'
                      : 'border-black/5 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`صورة ${i + 1}`}
                    fill
                    loading="lazy"
                    sizes={getImageSizes('thumbnail')}
                    className="object-cover mix-blend-multiply p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Side */}
        <div className="w-full md:w-7/12 flex flex-col justify-start p-8 md:p-12 bg-surface border-t md:border-t-0 md:border-r border-black/10 pb-40 md:pb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="text-accent font-bold text-[10px] tracking-[0.3em] uppercase mb-2 block">
              {product.engName || 'Featured product'}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-3 leading-tight">
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl md:text-2xl font-bold text-brand">
                {Number(currentPrice).toLocaleString('ar-SA')} {currency}
              </span>
              {hasDiscount && (
                <span className="text-lg text-foreground/40 line-through">
                  {Number(currentCompareAtPrice).toLocaleString('ar-SA')} {currency}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-foreground/70 text-sm md:text-base leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {hasVariants && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">اختر الحجم</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                      className={`px-5 py-2 border rounded-full text-sm font-bold transition-all ${
                        selectedVariant?.id === v.id
                          ? 'bg-brand text-white border-brand shadow'
                          : 'bg-white text-foreground border-black/10 hover:border-brand/50'
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 bg-white p-4 border border-black/5 rounded-xl">
              {!hasVariants && product.size && (
                <div className="flex flex-col">
                  <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-wider mb-1">الحجم</span>
                  <span className="text-foreground text-sm font-bold" dir="ltr">{product.size}</span>
                </div>
              )}
              {product.gender && (
                <div className="flex flex-col">
                  <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-wider mb-1">الجنس</span>
                  <span className="text-foreground text-sm font-bold">{product.gender}</span>
                </div>
              )}
              {product.color && (
                <div className="flex flex-col">
                  <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-wider mb-1">الفئة</span>
                  <span className="text-foreground text-sm font-bold">{product.color}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-wider mb-1">المخزون</span>
                <span className={`text-sm font-bold ${currentStock > 0 ? 'text-brand' : 'text-red-500'}`}>
                  {currentStock > 0 ? 'متوفر' : 'نفد من المخزون'}
                </span>
              </div>
            </div>

            {/* Desktop Purchase Buttons */}
            <div className="hidden md:flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-black/10 bg-white h-14 w-32 rounded-xl shrink-0 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="flex-1 text-center font-bold text-base text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="w-10 h-full flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="flex-1 bg-white border-2 border-brand text-brand font-bold h-14 flex items-center justify-center gap-2 hover:bg-brand/5 transition-all rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={18} />
                  أضف إلى السلة
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full bg-brand text-white font-bold h-14 flex items-center justify-center gap-2 hover:bg-brand-hover transition-all rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                <CreditCard size={20} />
                اشترِ الآن
              </button>
            </div>

            <div className="flex items-center gap-4 border-t border-dashed border-foreground/10 pt-4 mt-2">
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-xs font-bold text-brand hover:text-brand-hover transition-colors border-b border-brand pb-0.5"
              >
                عرض تفاصيل المنتج كاملة ←
              </Link>
              <button
                onClick={handleCopyLink}
                className="text-xs font-bold text-foreground/50 hover:text-foreground transition-colors border-b border-dashed border-foreground/30 hover:border-foreground pb-0.5"
              >
                نسخ الرابط
              </button>
            </div>
          </motion.div>
        </div>

        {/* Mobile Fixed Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-3 pb-safe flex flex-col gap-2 z-[120] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" dir="rtl">
          <button
            onClick={handleBuyNow}
            disabled={currentStock <= 0}
            className="w-full bg-brand text-white h-11 text-sm font-bold hover:bg-brand-hover transition-colors rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <CreditCard size={18} />
            اشترِ الآن
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-black/10 h-10 w-24 shrink-0 rounded-xl overflow-hidden bg-surface">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-foreground active:bg-black/5">
                <Minus size={14} />
              </button>
              <div className="flex-1 text-center text-sm font-bold text-foreground">{quantity}</div>
              <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} className="w-10 h-full flex items-center justify-center text-foreground active:bg-black/5">
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
              className="flex-1 bg-white border border-brand text-brand h-10 font-bold hover:bg-brand/5 transition-colors rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40"
            >
              <ShoppingBag size={16} />
              أضف للسلة
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function ProductsClient({
  products,
  title,
  subtitle,
  type,
}: {
  products: ProductItem[];
  title?: string;
  subtitle?: string;
  type?: string;
}) {
  const currency = useCurrency()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <section
      id={type || 'products'}
      className={`py-10 md:py-24 px-4 md:px-6 ${type === 'offers' ? 'bg-surface-alt' : 'bg-surface'} relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-20"
        >
          <span className="text-accent tracking-[0.3em] uppercase text-xs font-bold mb-3 md:mb-4 block">
            {subtitle || 'المجموعة الحصرية'}
          </span>
          <h2 className="text-2xl md:text-5xl font-black text-foreground mb-4 md:mb-6">
            {title || 'اكتشف منتجاتنا'}
          </h2>
          <div className="w-12 md:w-16 h-[2px] bg-brand mx-auto mb-5 md:mb-8" />
          <Link
            href="/products"
            className="inline-block text-xs md:text-sm text-brand border-b border-brand/30 pb-1 hover:border-brand transition-colors"
          >
            عرض المجموعة كاملة ←
          </Link>
        </motion.div>

        {products.length === 0 ? (
          <div className="text-center text-foreground/40 py-20 text-lg font-light">
            لم يتم إضافة منتجات بعد
          </div>
        ) : (
          <div className="relative">
            {/* Mobile Slider */}
            <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 pb-6 no-scrollbar px-2">
              {products.map((product, index) => (
                <motion.div
                  key={`mobile-${product.id}`}
                  onClick={() => setSelectedId(product.id)}
                  className="relative min-w-[58vw] h-[290px] snap-center bg-white shadow-md hover:shadow-xl border border-black/20 rounded-2xl overflow-hidden flex flex-col cursor-pointer group"
                >
                  <div className="relative w-full h-[58%] bg-surface/50 p-4 flex items-center justify-center">
                    <button 
                      className={`absolute top-4 right-4 z-20 transition-transform hover:scale-110 active:scale-95 drop-shadow-md ${
                        isFavorite(product.id) ? 'text-red-500' : 'text-white hover:text-red-500'
                      }`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const isFav = isFavorite(product.id);
                        toggleFavorite({
                          id: product.id,
                          name: product.name,
                          slug: product.slug,
                          price: product.rawPrice || 0,
                          compareAtPrice: product.compareAtPrice || null,
                          imageUrl: product.image,
                          engName: product.engName
                        });
                        showToast('subtle', isFav ? 'تمت الازاله من المفضله' : 'تمت الاضافه الى المفضله');
                      }}
                      aria-label="إضافة للمفضلة"
                    >
                      <Heart 
                        size={20} 
                        fill={isFavorite(product.id) ? "currentColor" : "#ffffff"} 
                        stroke={isFavorite(product.id) ? "currentColor" : "rgba(0,0,0,0.4)"}
                        strokeWidth={1.5}
                      />
                    </button>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? undefined : 'lazy'}
                        sizes={getImageSizes('card-mobile')}
                        className="object-contain p-6 mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-accent/30 text-4xl">متجرنا</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-3 text-center bg-white z-10 border-t border-black/10">
                    <h3 className="text-base font-black text-foreground mb-0.5">{product.name}</h3>
                    <p className="text-accent text-[9px] tracking-widest uppercase mb-1.5">{product.engName}</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-brand font-bold text-sm">{product.price}</p>
                      {product.compareAtPrice && (
                        <p className="text-foreground/40 line-through text-[10px]">
                          {Number(product.compareAtPrice).toLocaleString('ar-SA')} {currency}
                        </p>
                      )}
                    </div>
                    <button className="text-[9px] font-bold uppercase tracking-wider text-brand border-b border-brand pb-0.5">
                      اكتشف المنتج
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={`desktop-${product.id}`}
                  onClick={() => setSelectedId(product.id)}
                  className="relative h-[550px] bg-white cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-500 border border-black/20 hover:border-brand/40 rounded-3xl flex flex-col overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative w-full h-[65%] bg-surface/50 transition-colors duration-500 group-hover:bg-surface-alt flex items-center justify-center p-8">
                    <button 
                      className={`absolute top-4 right-4 z-20 transition-all duration-300 drop-shadow-md hover:scale-110 active:scale-95 ${
                        isFavorite(product.id) ? 'text-red-500 opacity-100' : 'text-white hover:text-red-500 opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const isFav = isFavorite(product.id);
                        toggleFavorite({
                          id: product.id,
                          name: product.name,
                          slug: product.slug,
                          price: product.rawPrice || 0,
                          compareAtPrice: product.compareAtPrice || null,
                          imageUrl: product.image,
                          engName: product.engName
                        });
                        showToast('subtle', isFav ? 'تمت الازاله من المفضله' : 'تمت الاضافه الى المفضله');
                      }}
                      aria-label="إضافة للمفضلة"
                    >
                      <Heart 
                        size={22} 
                        fill={isFavorite(product.id) ? "currentColor" : "#ffffff"} 
                        stroke={isFavorite(product.id) ? "currentColor" : "rgba(0,0,0,0.4)"}
                        strokeWidth={1.5}
                      />
                    </button>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? undefined : 'lazy'}
                        sizes={getImageSizes('card-hero')}
                        className="object-contain p-8 mix-blend-multiply scale-95 group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-accent/20 text-6xl group-hover:text-accent/40 transition-colors">
                        متجرنا
                      </div>
                    )}
                    {product.compareAtPrice && (
                      <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow z-10">
                        خصم
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white z-10 border-t border-black/10">
                    <h3 className="text-2xl font-black text-foreground mb-2">{product.name}</h3>
                    <p className="text-accent text-xs tracking-[0.2em] uppercase">{product.engName}</p>
                    <div className="flex items-center gap-2 my-4">
                      <p className="text-brand font-bold text-lg">{product.price}</p>
                      {product.compareAtPrice && (
                        <p className="text-foreground/40 line-through text-sm">
                          {Number(product.compareAtPrice).toLocaleString('ar-SA')} {currency}
                        </p>
                      )}
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-brand border-b border-brand/30 group-hover:border-brand pb-1 transition-colors">
                      اكتشف المنتج
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedId && selectedProduct && (
          <DetailModal product={selectedProduct} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
