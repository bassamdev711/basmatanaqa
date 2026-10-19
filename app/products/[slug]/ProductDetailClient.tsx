'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Minus, Plus, X, ShoppingBag, CreditCard, Share2 } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { getImageSizes } from '@/lib/image-utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCartAnimation } from '@/components/CartAnimationProvider'
import { useToast } from '@/components/ToastProvider'
import { useCurrency } from '@/components/CurrencyProvider'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { getProductWhatsAppLink } from '@/lib/whatsapp-order'
import ScrollableSizesRow from '@/components/ScrollableSizesRow'

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
  shortCode?: string | null
  itemNumber?: number | null
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
  hasSizes?: boolean
  availableSizes?: string[]
  collection?: { name: string } | null
  subCategory?: { name: string } | null
  engName?: string
  variants?: ProductVariant[]
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const currency = useCurrency()
  const router = useRouter()
  const searchParams = useSearchParams()

  const allImages = [product.imageUrl, ...product.images].filter(Boolean) as string[]

  // Initial image from search query (?img=1 or ?img=0)
  const initialImgParam = searchParams.get('img')
  const initialImgIndex = initialImgParam !== null ? parseInt(initialImgParam, 10) : 0
  const defaultInitialImage = (!isNaN(initialImgIndex) && allImages[initialImgIndex]) ? allImages[initialImgIndex] : (allImages[0] || '')

  const [activeImage, setActiveImage] = useState(defaultInitialImage)
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
        .catch(() => { })
    }
  }, [product.id])

  // Variants state
  const hasVariants = product.variants && product.variants.length > 0
  const sizeParam = searchParams.get('size')

  const initialVariant = hasVariants
    ? (sizeParam ? product.variants!.find(v => v.size === sizeParam) || product.variants![0] : product.variants![0])
    : null
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(initialVariant)

  // Dynamic Sizes State
  const initialDynamicSize = product.hasSizes && product.availableSizes && product.availableSizes.length > 0
    ? (sizeParam && product.availableSizes.includes(sizeParam) ? sizeParam : product.availableSizes[0])
    : null
  const [selectedDynamicSize, setSelectedDynamicSize] = useState<string | null>(initialDynamicSize)

  // Current Displayed Data
  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const currentCompareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock
  const currentSize = selectedDynamicSize || (selectedVariant ? selectedVariant.size : product.size)

  // Calculate Discount Percentage
  const hasDiscount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
  const discountPercentage = hasDiscount
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0

  const handleAddToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (product.hasSizes && !selectedDynamicSize) {
      showToast('error', 'الرجاء اختيار المقاس أولاً')
      return false
    }

    if (currentStock <= 0) {
      showToast('error', 'نعتذر، هذا المنتج نفد من المخزون.')
      return false
    }
    if (quantity > currentStock) {
      showToast('error', `عذراً، المتوفر في المخزون هو ${currentStock} فقط.`)
      return false
    }

    addToCart({
      id: selectedVariant
        ? `${product.id}-${selectedVariant.id}`
        : selectedDynamicSize
          ? `${product.id}-${selectedDynamicSize}`
          : product.id,
      name: selectedVariant
        ? `${product.name} (${selectedVariant.size})`
        : selectedDynamicSize
          ? `${product.name} (${selectedDynamicSize})`
          : product.name,
      slug: product.slug,
      price: currentPrice,
      imageUrl: product.imageUrl || '',
      quantity,
      maxStock: currentStock,
      selectedSize: selectedDynamicSize || undefined,
    })

    // Fly-to-cart animation
    const btn = e?.currentTarget || addToCartBtnRef.current
    if (btn) flyToCart(btn)

    // Track add to cart
    fetch('/api/track/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id })
    }).catch(() => { })

    return true
  }

  const handleShare = async () => {
    // Find active image index in allImages
    const activeImageIdx = allImages.findIndex(img => img === activeImage)
    const code = product.shortCode || product.slug

    // Build query params for state preservation
    const queryParts: string[] = []
    if (activeImageIdx > 0) {
      queryParts.push(`img=${activeImageIdx}`)
    }
    const chosenSize = selectedDynamicSize || selectedVariant?.size
    if (chosenSize) {
      queryParts.push(`size=${encodeURIComponent(chosenSize)}`)
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
    const shortUrl = `${window.location.origin}/p/${code}${queryString}`

    // Compose elegant and attractive multi-line message with courteous emojis
    const lines = [
      '✨ متجر شهرزاد ✨',
      `🛍️ المنتج: ${product.name}`,
      `💰 السعر: ${currentPrice} ${currency}`,
    ]

    if (product.collection?.name) {
      lines.push(`🏷️ القسم: ${product.collection.name}`)
    }
    if (product.subCategory?.name) {
      lines.push(`📂 التصنيف: ${product.subCategory.name}`)
    }
    if (chosenSize) {
      lines.push(`📏 المقاس المختار: ${chosenSize}`)
    }

    lines.push('')
    lines.push('🔗 رابط وتفاصيل المنتج:')
    lines.push(shortUrl)

    const shareText = lines.join('\n')

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | متجر شهرزاد`,
          text: shareText,
        })
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.log('Error sharing', err)
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
      showToast('success', 'تم نسخ تفاصيل ورابط المنتج بنجاح!')
    }
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

  const handleWhatsAppOrder = () => {
    if (product.hasSizes && !selectedDynamicSize) {
      showToast('error', 'الرجاء اختيار المقاس أولاً لتأكيد طلبك')
      return
    }
    if (hasVariants && !selectedVariant) {
      showToast('error', 'الرجاء اختيار المقاس أولاً لتأكيد طلبك')
      return
    }
    if (currentStock <= 0) {
      showToast('error', 'نعتذر، هذا المنتج نفد من المخزون.')
      return
    }

    const chosenSize = selectedVariant?.size || selectedDynamicSize || product.size || null

    const url = getProductWhatsAppLink({
      name: product.name,
      size: chosenSize,
      price: currentPrice,
      currency,
      quantity,
      slug: product.slug,
    })
    window.open(url, '_blank')
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
                      className="object-contain p-4 md:p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
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
                    className={`relative w-16 h-16 bg-white border shrink-0 transition-all rounded-md overflow-hidden ${activeImage === img ? 'border-brand shadow-sm scale-105' : 'border-black/5 opacity-60 hover:opacity-100 hover:border-black/20'
                      }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`صورة ${i + 1}`}
                        fill
                        loading="lazy"
                        sizes={getImageSizes('thumbnail')}
                        className="object-contain p-1 mix-blend-multiply"
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
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-accent font-bold text-[10px] tracking-widest uppercase mb-2 block">
                      {product.engName || product.brand || 'Featured product'}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-black text-foreground mb-2">{product.name}</h1>
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-2 mt-1 bg-white border border-black/10 rounded-xl text-foreground hover:bg-black/5 hover:border-black/20 transition-all shadow-sm shrink-0 active:scale-95 group"
                    title="مشاركة المنتج"
                  >
                    <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-foreground group-hover:text-brand transition-colors">
                      <Share2 size={18} />
                    </div>
                    <span className="text-[11px] font-bold text-foreground/80 group-hover:text-foreground">مشاركة</span>
                  </button>
                </div>
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
                <ScrollableSizesRow
                  title="اختر المقاس / الحجم:"
                  options={product.variants!.map((variant) => ({
                    id: variant.id,
                    label: variant.size,
                    isSelected: selectedVariant?.id === variant.id,
                    onClick: () => {
                      setSelectedVariant(variant)
                      setQuantity(1)
                    },
                  }))}
                />
              )}

              {/* Dynamic Sizes Selector */}
              {product.hasSizes && product.availableSizes && product.availableSizes.length > 0 && !hasVariants && (
                <ScrollableSizesRow
                  title="اختر المقاس:"
                  options={product.availableSizes.map((size) => ({
                    id: size,
                    label: size,
                    isSelected: selectedDynamicSize === size,
                    onClick: () => {
                      setSelectedDynamicSize(size)
                      setQuantity(1)
                    },
                  }))}
                />
              )}

              {/* Specs Grid (Compact) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-white p-4 border border-black/5 rounded-lg">
                {!hasVariants && !product.hasSizes && currentSize && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">الحجم</span>
                    <span className="text-foreground text-sm font-bold" dir="ltr">{currentSize}</span>
                  </div>
                )}
                {product.collection?.name && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">المجموعة</span>
                    <span className="text-foreground text-sm font-bold">{product.collection.name}</span>
                  </div>
                )}
                {product.subCategory?.name && (
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[11px] font-bold mb-1">التصنيف</span>
                    <span className="text-foreground text-sm font-bold">{product.subCategory.name}</span>
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

                <button
                  onClick={handleWhatsAppOrder}
                  disabled={currentStock <= 0}
                  className="w-full h-14 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-base md:text-lg gap-2.5 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <WhatsAppIcon size={22} />
                  <span>اطلب عبر واتساب مباشرة</span>
                </button>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Fixed Bottom Bar for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] flex items-center justify-between gap-2 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" dir="rtl">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] text-foreground/60 font-bold">الإجمالي</span>
            <span className="text-sm font-black text-brand leading-none">{Number(currentPrice * quantity).toLocaleString('ar-SA')} {currency}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <button
              onClick={handleAddToCartClick}
              disabled={currentStock <= 0}
              className="btn btn-outline btn-icon shrink-0 rounded-lg disabled:opacity-50 h-11 w-11"
              title="أضف للسلة"
            >
              <ShoppingBag size={18} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={currentStock <= 0}
              className="btn btn-primary rounded-lg disabled:opacity-50 text-xs px-3 h-11"
            >
              اشترِ الآن
            </button>
            <button
              onClick={handleWhatsAppOrder}
              disabled={currentStock <= 0}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg flex items-center gap-1.5 px-3 h-11 font-bold text-xs disabled:opacity-50 shrink-0 shadow-sm"
              title="اطلب عبر واتساب"
            >
              <WhatsAppIcon size={16} />
              <span>واتساب</span>
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
