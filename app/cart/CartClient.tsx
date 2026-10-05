'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ArrowLeft, Tag, Loader2 } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { useState, useSyncExternalStore } from 'react'
import { useCurrency } from '@/components/CurrencyProvider'

const emptySubscribe = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export default function CartClient() {
  const currency = useCurrency()

  const { cartItems, removeFromCart, updateQuantity, cartTotal, finalTotal, appliedCoupon, couponLoading, couponError, applyCoupon, removeCoupon } = useCart()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const [couponCode, setCouponCode] = useState('')

  // Avoid hydration mismatch by only rendering after hydration.
  if (!mounted) {
    return (
      <div className="flex-grow flex items-center justify-center pt-32 pb-24 min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <div className="flex-grow pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto w-full">
        
        <div className="mb-6 md:mb-12">
          <h1 className="text-xl md:text-5xl font-black text-foreground mb-1.5 md:mb-3">حقيبة التسوق</h1>
          <p className="text-sm md:text-lg text-foreground/70">لديك {cartItems.length} عنصر في حقيبتك</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white border border-black/5 flex flex-col items-center">
            <p className="text-xl text-foreground/50 mb-6">حقيبة التسوق فارغة</p>
            <Link href="/products" className="btn btn-primary btn-lg rounded-sm">
              متابعة التسوق
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            
            {/* Cart Items */}
            <div className="lg:col-span-8 flex flex-col space-y-3 md:space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-row items-center p-2.5 md:p-6 bg-white border border-black/5 gap-3 md:gap-6 group hover:shadow-md transition-shadow">
                  <div className="w-16 h-20 md:w-32 md:h-40 bg-surface-alt shrink-0 relative flex items-center justify-center border border-black/5 overflow-hidden">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                        sizes="128px"
                      />
                    ) : (
                      <div className="text-accent/30 text-2xl">متجرنا</div>
                    )}
                  </div>
                  
                  <div className="flex-grow flex flex-col h-full justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/products/${item.slug}`} className="text-sm md:text-xl font-black text-foreground hover:text-brand transition-colors line-clamp-2 md:line-clamp-1">
                          {item.name}
                        </Link>
                        <button onClick={() => removeFromCart(item.id)} aria-label="إزالة" className="text-foreground/40 hover:text-red-500 transition-colors shrink-0 mr-2 md:mr-0">
                          <X size={18} strokeWidth={2} className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                      {/* Subtitle/Size could go here if we tracked it in cart, for now omit or use static */}
                    </div>
                    
                    <div className="flex justify-between items-end mt-2 md:mt-0">
                      <div className="flex items-center border border-black/10 rounded-none h-8 md:h-10 w-24 md:w-28 overflow-hidden bg-surface">
                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-1/3 h-full flex items-center justify-center text-foreground hover:bg-black/5">
                          <Minus size={12} className="md:w-3.5 md:h-3.5" />
                        </button>
                        <div className="w-1/3 h-full flex items-center justify-center font-bold text-xs md:text-sm">
                          {item.quantity}
                        </div>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-1/3 h-full flex items-center justify-center text-foreground hover:bg-black/5">
                          <Plus size={12} className="md:w-3.5 md:h-3.5" />
                        </button>
                      </div>
                      <div className="font-bold text-brand text-sm md:text-xl">
                        {(item.price * item.quantity).toLocaleString('ar-SA')} {currency}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-black/5 p-3 md:p-8 sticky top-20 md:top-32 shadow-sm">
                <h2 className="text-base md:text-2xl font-black text-foreground mb-3 md:mb-6 border-b border-black/5 pb-3">ملخص الطلب</h2>

                {/* Coupon Input */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-accent" />
                    كوبون خصم
                  </p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-brand/5 border border-brand/20 rounded-sm px-3 py-2.5">
                      <div>
                        <span className="font-mono font-black text-brand text-sm">{appliedCoupon.code}</span>
                        <p className="text-xs text-brand/70 mt-0.5">
                          خصم {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}%` : `${appliedCoupon.value.toLocaleString('ar-SA')} {currency}`}
                        </p>
                      </div>
                      <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-hidden">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="أدخل كود الخصم"
                        dir="ltr"
                        className="min-w-0 flex-1 h-[44px] border border-black/10 rounded-sm px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:border-brand bg-surface"
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon(couponCode)}
                      />
                      <button
                        onClick={() => applyCoupon(couponCode)}
                        disabled={couponLoading || !couponCode.trim()}
                        className="btn btn-primary shrink-0 px-4 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'تطبيق'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-xs mt-1.5">{couponError}</p>
                  )}
                </div>

                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                  <div className="flex justify-between text-foreground">
                    <span>المجموع الفرعي</span>
                    <span className="font-bold">{cartTotal.toLocaleString('ar-SA')} {currency}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-brand">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        خصم الكوبون
                      </span>
                      <span className="font-bold">- {appliedCoupon.discountAmount.toLocaleString('ar-SA')} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground">
                    <span>الشحن والتوصيل</span>
                    <span className="font-bold text-foreground/60 text-sm">يُحسب عند إتمام الطلب</span>
                  </div>
                </div>

                <div className="border-t border-black/5 pt-6 mb-8 flex justify-between items-end">
                  <span className="text-base md:text-lg font-bold text-foreground">الإجمالي</span>
                  <div className="text-right">
                    {appliedCoupon && (
                      <p className="text-foreground/40 text-xs md:text-sm line-through">{cartTotal.toLocaleString('ar-SA')} {currency}</p>
                    )}
                    <span className="text-2xl md:text-3xl font-black text-brand">{finalTotal.toLocaleString('ar-SA')} {currency}</span>
                  </div>
                </div>

                <Link href="/checkout" className="btn btn-primary w-full btn-lg gap-2 group !bg-accent !text-foreground hover:!bg-accent/90 border border-black/10">
                  <span>إتمام الطلب</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
