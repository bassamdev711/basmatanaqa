'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Minus, Plus, X, ShoppingBag, CreditCard } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { getImageSizes } from '@/lib/image-utils'
import { useRouter } from 'next/navigation'
import { useCartAnimation } from '@/components/CartAnimationProvider'
import { useToast } from '@/components/ToastProvider'
import { useCurrency } from '@/components/CurrencyProvider'

interface ProductVariant {
  id: string
  size: string
  price: number
  compareAtPrice: number | null
  stock: number
}

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  price: number
  compareAtPrice: number | null
  size: string | null
  gender: string | null
  category: string | null
  imageUrl: string | null
  images: string[]
  featured: boolean
  bestseller: boolean
  stock: number
  engName?: string
  variants?: ProductVariant[]
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const currency = useCurrency()

  const router = useRouter()
  const allImages = [product.imageUrl, ...product.images].filter(Boolean) as string[]
  const [activeImage, setActiveImage] = useState(allImages[0] || '')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  const { addToCart } = useCart()
  const { flyToCart } = useCartAnimation()
  const { showToast } = useToast()
  const addToCartBtnRef = useRef<HTMLButtonElement>(null)

  // Track view on mount (Smart Tracking)
  useEffect(() => {
    const sessionKey = `viewed_${product.id}`
    if (!sessionStorage.getItem(sessionKey)) {
      fetch('/api/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      })
      .then(() => sessionStorage.setItem(sessionKey, 'true'))
      .catch(() => {})
    }
  }, [product.id])

  // Variants state
  const hasVariants = product.variants && product.variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(hasVariants ? product.variants![0] : null)

  // Current Displayed Data
  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const currentCompareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock
  const currentSize = selectedVariant ? selectedVariant.size : product.size

  // Calculate Discount Percentage
  const hasDiscount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
  const discountPercentage = hasDiscount 
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0

  const handleAddToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (currentStock <= 0) {
      showToast('error', 'نعتذر، هذا المنتج نفد من المخزون.')
      return false
    }
    if (quantity > currentStock) {
      showToast('error', `عذراً، المتوفر في المخزون هو ${currentStock} فقط.`)
      return false
    }

    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: selectedVariant ? `${product.name} (${selectedVariant.size})` : product.name,
      slug: product.slug,
      price: currentPrice,
      imageUrl: product.imageUrl || '',
      quantity,
      maxStock: currentStock,
    })
    
    // Fly-to-cart animation
    const btn = e?.currentTarget || addToCartBtnRef.current
    if (btn) flyToCart(btn)
    
    // Track add to cart
    fetch('/api/track/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id })
    }).catch(() => {})

    return true
  }

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    const added = handleAddToCart(e)
    if (added) {
      router.push('/checkout')
    }
  }

  const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleAddToCart(e)
  }

  return (
    <>
      <div className="relative bg-surface text-foreground pb-16" dir="rtl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
          
          {/* ======= Left: Image Gallery ======= */}
          <div className="w-full lg:w-5/12 flex flex-col gap-3">
            
            {/* Main Image Stage */}
            <div 
              className="w-full mx-auto aspect-square max-h-[400px] md:max-h-[550px] bg-white relative overflow-hidden border border-black/5 flex items-center justify-center cursor-zoom-in group rounded-lg"
              onClick={() => setLightboxOpen(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={product.name}
                      fill
                      priority
                      className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                      sizes={getImageSizes('detail')}
                    />
                  ) : (
                    <Sparkles className="w-12 h-12 text-accent/20" />
                  )}
                  {hasDiscount && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-sm z-10">
                      وفر {discountPercentage}%
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 justify-center">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 bg-white border shrink-0 transition-all rounded-md overflow-hidden ${
                      activeImage === img ? 'border-brand shadow-sm scale-105' : 'border-black/5 opacity-60 hover:opacity-100 hover:border-black/20'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`صورة ${i + 1}`}
                        fill
                        loading="lazy"
                        sizes={getImageSizes('thumbnail')}
                        className="object-cover mix-blend-multiply"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======= Right: Product Info ======= */}
          <div className="w-full lg:w-7/12 flex flex-col text-right">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <span className="text-accent font-bold text-[10px] tracking-widest uppercase mb-2 block">
                  {product.engName || product.brand || 'Featured product'}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-foreground mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-2xl md:text-3xl font-bold text-brand">
                    {Number(currentPrice).toLocaleString('ar-SA')} {currency}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg md:text-xl text-foreground/40 line-through">
                      {Number(currentCompareAtPrice).toLocaleString('ar-SA')} {currency}
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Variants Selector */}
              {hasVariants && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-foreground mb-3">اختر الحجم:</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.variants!.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant)
                          setQuantity(1)
                        }}
                        className={`px-6 py-2 border rounded-full text-sm font-bold transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'bg-brand text-surface border-brand shadow-md'
                            : 'bg-white text-foreground border-black/10 hover:border-brand/50'
                        }`}
                      >
                        {variant.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs Grid (Compact) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-white p-4 border border-black/5 rounded-lg">
                {!hasVariants && currentSize && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">الحجم</span>
                    <span className="text-foreground text-sm font-bold" dir="ltr">{currentSize}</span>
                  </div>
                )}
                {product.gender && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">الجنس</span>
                    <span className="text-foreground text-sm font-bold">{product.gender}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">التصنيف</span>
                    <span className="text-foreground text-sm font-bold">{product.category}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-foreground/50 text-[11px] font-bold mb-1">حالة التوفر</span>
                  <span className={currentStock > 0 ? "text-brand text-sm font-bold" : "text-red-500 text-sm font-bold"}>
                    {currentStock > 0 ? "متوفر" : "نفد من المخزون"}
                  </span>
                </div>
              </div>

              {/* Purchase Actions */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center border border-black/10 bg-white h-14 w-32 rounded-lg shrink-0">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-full flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-10 h-full flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCartClick}
                    disabled={currentStock <= 0}
                    className="btn btn-outline flex-1 h-14 gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={20} />
                    أضف إلى السلة
                  </button>
                </div>
                
                <button 
                  onClick={handleBuyNow}
                  disabled={currentStock <= 0}
                  className="btn btn-primary w-full h-14 text-lg gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={20} />
                  اشترِ الآن
                </button>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Fixed Bottom Bar for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center justify-between gap-3 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" dir="rtl">
          <div className="flex flex-col">
             <span className="text-xs text-foreground/60 font-bold">الإجمالي</span>
             <span className="text-base font-black text-brand leading-none">{Number(currentPrice * quantity).toLocaleString('ar-SA')} {currency}</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button 
              onClick={handleAddToCartClick}
              disabled={currentStock <= 0}
              className="btn btn-outline btn-icon shrink-0 rounded-lg disabled:opacity-50"
            >
              <ShoppingBag size={20} />
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={currentStock <= 0}
              className="btn btn-primary flex-1 max-w-[140px] rounded-lg disabled:opacity-50"
            >
              اشترِ الآن
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for Image Zoom */}
      <AnimatePresence>
        {lightboxOpen && activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
            onClick={() => setLightboxOpen(false)}
            dir="ltr"
          >
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 bg-surface text-foreground p-3 rounded-full hover:bg-accent transition-colors z-[101] shadow-lg"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl h-full flex items-center justify-center cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
                onClick={() => setLightboxOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
