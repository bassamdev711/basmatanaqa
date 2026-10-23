'use client'

import React, { useEffect, useState, useSyncExternalStore, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, AlertCircle, CheckCircle2, PhoneCall } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { useCheckout } from '@/components/CheckoutProvider'
import { getPaymentMethods } from './actions'
import { createOrder } from './actions'
import { useCurrency } from '@/components/CurrencyProvider'
import { PhoneInput } from '@/components/PhoneInput'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { getCheckoutWhatsAppLink } from '@/lib/whatsapp-order'

type ShippingCity = { id: string; name: string; shippingFee: number }
type PaymentSettingsResponse = {
  settings: {
    codEnabled: boolean
    bankTransferEnabled: boolean
    walletsEnabled: boolean
    codFee: number
    customerServiceEnabled: boolean
  } | null
  storeSettings: { shippingFee: number; freeShippingThreshold: number; couponsEnabled?: boolean }
  shippingCities: ShippingCity[]
  bankAccounts: any[]
  digitalWallets: any[]
  loyaltyInfo: { balance: number; pointsValue: number; pointsPerUnit: number; maxPointsPerOrder: number | null } | null
  userInfo: { name: string; phone: string } | null
}

const emptySubscribe = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export default function CheckoutClient() {
  const currency = useCurrency()

  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, appliedCoupon, syncCartPrices } = useCart()
  const { checkoutData, setCheckoutData } = useCheckout()
  const router = useRouter()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [phoneError, setPhoneError] = useState('')
  
  const idempotencyKeyRef = useRef<string | null>(null)
  const phoneContainerRef = useRef<HTMLDivElement>(null)
  
  const [priceChanges, setPriceChanges] = useState<{id: string, name: string, oldPrice: number, newPrice: number}[] | null>(null)
  const [priceChangesTotal, setPriceChangesTotal] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    ...checkoutData,
    paymentMethod: 'customer_service'
  })

  useEffect(() => {
    getPaymentMethods().then(data => {
      if (!data) {
        throw new Error('No data returned');
      }
      setPaymentSettings(data)
      setFormData(prev => ({
        ...prev,
        fullName: data.userInfo?.name || prev.fullName,
        phone: data.userInfo?.phone ? data.userInfo.phone.replace('+967', '') : prev.phone,
        city: data.shippingCities.find((city) => city.name === prev.city)?.name || '',
        paymentMethod: 'customer_service',
      }))
    }).catch(err => {
      console.error('Failed to load payment methods:', err);
      // Provide fallback so it doesn't stay blank
      setPaymentSettings({
        settings: { codEnabled: false, bankTransferEnabled: false, walletsEnabled: false, codFee: 0, customerServiceEnabled: true },
        storeSettings: { shippingFee: 0, freeShippingThreshold: 0, couponsEnabled: true },
        shippingCities: [],
        bankAccounts: [],
        digitalWallets: [],
        loyaltyInfo: null,
        userInfo: null
      });
    })
  }, [])

  if (!mounted || !paymentSettings) {
    return (
      <div className="flex-grow flex items-center justify-center pt-32 pb-24 min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 min-h-[60vh]" dir="rtl">
        <h1 className="text-3xl font-black mb-4">السلة فارغة</h1>
        <p className="mb-8">قم بإضافة منتجات للسلة أولاً لمتابعة الطلب.</p>
        <Link href="/products" className="btn btn-primary btn-lg rounded-sm">
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const storeSettings = paymentSettings.storeSettings;
  const shippingCities = (paymentSettings.shippingCities || []).filter(
    (city: ShippingCity) => city.name !== 'أخرى' && city.name !== 'اخري'
  );
  const hasAvailableCity = shippingCities.length > 0
  
  let baseShippingFee = storeSettings.shippingFee;
  if (shippingCities.length > 0) {
    const selectedCity = shippingCities.find((c: ShippingCity) => c.name === formData.city);
    if (selectedCity) baseShippingFee = selectedCity.shippingFee;
  }

  const isFreeShipping = storeSettings.freeShippingThreshold > 0 && cartTotal >= storeSettings.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : baseShippingFee;
  const preLoyaltyTotal = Math.max(0, cartTotal - (appliedCoupon?.discountAmount || 0)) + shippingFee;
  const finalTotal = preLoyaltyTotal;

  const validateForm = () => {
    if (formData.phone.length !== 9 || !formData.phone.startsWith('7')) {
      setPhoneError('رقم الهاتف يجب أن يتكون من 9 أرقام ويبدأ بـ 7')
      phoneContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    setPhoneError('')

    if (!hasAvailableCity) {
      setError('لا توجد منطقة توصيل متاحة حالياً. يرجى التواصل مع المتجر.')
      return false
    }

    if (!formData.fullName || formData.fullName.trim().length < 2 || !formData.city) {
      setError('يرجى كتابة الاسم بالكامل واختيار منطقة التوصيل')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!validateForm()) return

    setIsSubmitting(true)
    setUploadStatus('جاري تسجيل الطلب...')
    setError('')
    setCheckoutData({ ...formData, paymentMethod: 'customer_service', shippingFee })

    try {
      const requestKey = idempotencyKeyRef.current
        || window.sessionStorage.getItem('tif_checkout_request')
        || window.crypto.randomUUID()
      idempotencyKeyRef.current = requestKey
      window.sessionStorage.setItem('tif_checkout_request', requestKey)

      const result = await createOrder(
        { 
          ...formData, 
          address: formData.address || formData.city || 'المنطقة المحددة', 
          paymentMethod: 'customer_service', 
          phone: `+967${formData.phone}`, 
          shippingFee 
        },
        cartItems,
        cartTotal,
        appliedCoupon?.code,
        undefined,
        undefined,
        requestKey,
        0
      )

      if (!result.success || !result.orderId) {
        if ((result as any).errorType === 'PRICE_CHANGED') {
          setPriceChanges((result as any).changes)
          setPriceChangesTotal((result as any).newTotal)
          setError('')
        } else {
          setError(result.error || 'حدث خطأ أثناء تسجيل الطلب')
        }
        setIsSubmitting(false)
        setUploadStatus('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      window.sessionStorage.removeItem('tif_checkout_request')
      clearCart()
      if (!result.trackingToken) {
        throw new Error('تعذر تجهيز رابط التتبع للطلب')
      }
      router.push(`/checkout/success/${result.orderId}?token=${encodeURIComponent(result.trackingToken)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      setIsSubmitting(false)
      setUploadStatus('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleWhatsAppCheckout = async () => {
    if (isSubmitting) return

    if (!validateForm()) return

    setIsSubmitting(true)
    setUploadStatus('جاري تسجيل الطلب وتجهيز الواتساب...')
    setError('')

    try {
      const requestKey = idempotencyKeyRef.current
        || window.sessionStorage.getItem('tif_checkout_request')
        || window.crypto.randomUUID()
      idempotencyKeyRef.current = requestKey
      window.sessionStorage.setItem('tif_checkout_request', requestKey)

      const result = await createOrder(
        { 
          ...formData, 
          address: formData.address || formData.city || 'المنطقة المحددة', 
          paymentMethod: 'customer_service', 
          phone: `+967${formData.phone}`, 
          shippingFee 
        },
        cartItems,
        cartTotal,
        appliedCoupon?.code,
        undefined,
        undefined,
        requestKey,
        0
      )

      const orderNumber = (result as any)?.orderNumber || (result?.success ? result.orderId : null)

      const waUrl = getCheckoutWhatsAppLink({
        customerName: formData.fullName,
        customerPhone: formData.phone,
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        items: cartItems.map(item => ({
          name: item.name,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.price,
          slug: item.slug
        })),
        total: finalTotal,
        currency,
        orderNumber,
      })

      window.open(waUrl, '_blank')
      window.sessionStorage.removeItem('tif_checkout_request')
      clearCart()

      if (result.success && result.orderId && result.trackingToken) {
        router.push(`/checkout/success/${result.orderId}?token=${encodeURIComponent(result.trackingToken)}`)
      } else {
        router.push('/')
      }
    } catch {
      const waUrl = getCheckoutWhatsAppLink({
        customerName: formData.fullName,
        customerPhone: formData.phone,
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        items: cartItems.map(item => ({
          name: item.name,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.price,
          slug: item.slug
        })),
        total: finalTotal,
        currency,
      })
      window.open(waUrl, '_blank')
      clearCart()
      router.push('/')
    } finally {
      setIsSubmitting(false)
      setUploadStatus('')
    }
  }

  return (
    <div className="flex-grow pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto w-full" dir="rtl">
      <div className="mb-4 md:mb-8">
        <Link href="/cart" className="inline-flex items-center text-foreground/60 hover:text-brand transition-colors font-bold gap-2 text-sm">
          <ArrowRight size={15} />
          العودة إلى السلة
        </Link>
      </div>
      
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-foreground mb-2">إتمام وتسجيل الطلب</h1>
        <p className="text-sm md:text-base text-foreground/60 max-w-md">
          أدخل بياناتك لتسجيل طلبك وسنتواصل معك مباشرة لتأكيد توفر المنتجات وترتيب الدفع والتوصيل.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200 font-bold flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {priceChanges && priceChanges.length > 0 && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-8 border border-amber-200 animate-in fade-in slide-in-from-top-4" dir="rtl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-black text-lg">تنبيه: تغيرت أسعار بعض المنتجات</h3>
              <p className="text-sm mt-1">لقد تغيرت أسعار المنتجات الموضحة أدناه بناءً على آخر تحديثات المتجر أو انتهاء العروض. يرجى مراجعتها وتأكيد السلة بالمبالغ الجديدة للمتابعة.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-amber-200 divide-y divide-amber-100 mb-4">
            {priceChanges.map(change => (
              <div key={change.id} className="p-3 flex justify-between items-center text-sm">
                <span className="font-bold">{change.name}</span>
                <div className="flex items-center gap-3 font-bold" dir="ltr">
                  <span className="line-through text-black/40">{change.oldPrice.toLocaleString()} {currency}</span>
                  <ArrowRight className="w-3 h-3 text-amber-500 mx-1" />
                  <span className={change.newPrice > change.oldPrice ? 'text-red-600' : 'text-green-600'}>
                    {change.newPrice.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            type="button"
            onClick={() => {
              syncCartPrices(priceChanges)
              setPriceChanges(null)
              setPriceChangesTotal(null)
            }}
            className="w-full btn bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 rounded-lg"
          >
            أوافق على الأسعار الجديدة، قم بتحديث السلة للمتابعة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
        
        {/* Right Column: Form */}
        <div className="md:col-span-7 order-2 md:order-1">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 bg-white p-5 md:p-8 rounded-2xl border border-black/5 shadow-sm">
            
            {/* Payment Suspended Notice Card */}
            <section className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-amber-950">
                    الدفع معلّق مؤقتاً
                  </h3>
                  <p className="text-xs md:text-sm text-amber-800/80">
                    لا يتطلب منك أي دفع إلكتروني أو تحويل بنكي الآن
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-amber-100 space-y-2">
                <p className="font-black text-base md:text-lg text-amber-900 leading-snug">
                  بمجرد إتمام الطلب سنتواصل معك لتأكيد توفره والدفع.
                </p>
                <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
                  حرصاً منا على خدمتكم والتأكد التام من توفر كافة المنتجات والمقاسات المطلوبة في المخزن قبل السداد، يتم استلام وتسجيل طلبكم أولاً، وسيقوم فريقنا بالتواصل معكم مباشرة لتأكيد التوفر وترتيب طريقة الدفع والتوصيل المناسبة.
                </p>
              </div>
            </section>

            {/* Shipping & Contact Details */}
            <section className="space-y-4">
              <h2 className="text-lg md:text-2xl font-bold text-foreground pb-2 border-b border-black/5">
                بيانات المستلم والشحن
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col">
                  <label htmlFor="fullName" className="text-sm font-bold text-foreground/80 mb-2">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="أدخل اسمك الكامل"
                    className="bg-surface-alt border border-black/10 rounded-xl px-4 py-3 outline-none focus:border-brand transition-colors text-sm"
                  />
                </div>
                
                <div className="flex flex-col" ref={phoneContainerRef}>
                  <label htmlFor="phone" className="text-sm font-bold text-foreground/80 mb-2">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput 
                    value={formData.phone}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, phone: val }))
                      if (phoneError) setPhoneError('')
                    }}
                    required
                  />
                  {phoneError && (
                    <span className="text-red-500 text-xs mt-1.5 font-bold animate-in slide-in-from-top-1 fade-in">
                      {phoneError}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="city" className="text-sm font-bold text-foreground/80 mb-2">
                    منطقة التوصيل <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    disabled={shippingCities.length === 0}
                    className="bg-surface-alt border border-black/10 rounded-xl px-4 py-3 outline-none focus:border-brand transition-colors text-sm appearance-none disabled:opacity-60 cursor-pointer"
                  >
                    <option value="" disabled>اختر منطقة التوصيل</option>
                    {shippingCities.map((city: ShippingCity) => (
                      <option key={city.id} value={city.name}>
                        {city.name}{city.shippingFee > 0 ? ` — رسوم الشحن: ${city.shippingFee} ${currency}` : ' — توصيل مجاني'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="address" className="text-sm font-bold text-foreground/80 mb-2">
                    العنوان التفصيلي أو ملاحظات التوصيل (اختياري)
                  </label>
                  <input 
                    type="text" 
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="اسم الحي، الشارع، أو أي تفاصيل إضافية لتسهيل وصول المندوب"
                    className="bg-surface-alt border border-black/10 rounded-xl px-4 py-3 outline-none focus:border-brand transition-colors text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-black/5 flex flex-col gap-3">
              {isSubmitting && uploadStatus && (
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl text-brand font-bold text-sm md:text-base flex items-center justify-center gap-3 shadow-sm animate-pulse">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || !hasAvailableCity || priceChanges !== null || !formData.fullName || !formData.phone || !formData.city}
                className="btn btn-primary w-full btn-lg gap-3 group !bg-brand !text-white hover:!bg-brand/90 border border-brand disabled:opacity-50 disabled:cursor-not-allowed md:h-16 h-14 md:text-lg shadow-sm font-bold rounded-xl"
              >
                {isSubmitting ? (uploadStatus || 'جاري تسجيل الطلب...') : 'إرسال الطلب الآن'}
                {!isSubmitting && <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />}
              </button>

              <button 
                type="button" 
                onClick={handleWhatsAppCheckout}
                disabled={isSubmitting || priceChanges !== null || !formData.fullName || !formData.phone || !formData.city}
                className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white md:h-14 h-12 px-6 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <WhatsAppIcon size={22} />
                <span>إرسال وتأكيد الطلب مباشرة عبر واتساب</span>
              </button>

              <p className="text-center text-xs text-foreground/50 pt-1">
                بالضغط على إرسال الطلب، أنت تؤكد رغبتك في شراء المنتجات وسنتواصل معك فوراً لتأكيد التوفر والدفع.
              </p>
            </div>
          </form>
        </div>

        {/* Left Column: Order Summary */}
        <aside className="md:col-span-5 order-1 md:order-2 relative">
          <div className="sticky top-20 md:top-32 bg-surface-alt p-5 md:p-8 rounded-2xl border border-black/5 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-6 border-b border-black/5 pb-4">
              ملخص الطلب ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} قطعة)
            </h2>
            
            <div className="space-y-3 md:space-y-4 mb-5 md:mb-8 max-h-[380px] overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-black/5">
                  <div className="w-16 h-16 bg-surface-alt shrink-0 rounded-lg border border-black/5 flex items-center justify-center relative overflow-hidden">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <span className="text-xs text-foreground/40 font-bold">منتج</span>
                    )}
                  </div>
                  <div className="flex-grow pt-0.5">
                    <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.name}</h4>
                    {item.selectedSize && (
                      <div className="text-xs text-foreground/60 mt-0.5 font-bold">
                        المقاس: <span className="text-foreground">{item.selectedSize}</span>
                      </div>
                    )}
                    <div className="text-brand text-sm font-bold mt-1">
                      {(item.price).toLocaleString('ar-SA')} {currency}
                    </div>
                    
                    {/* Quantity Control inside Checkout */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-black/10 rounded-lg bg-surface-alt">
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-black/5 transition-colors text-foreground"
                          title="تقليل الكمية"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-black/5 transition-colors text-foreground"
                          title="زيادة الكمية"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="حذف من السلة"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 pt-5 space-y-3">
              <div className="flex justify-between text-foreground text-sm">
                <span>قيمة المشتريات</span>
                <span className="font-bold">{cartTotal.toLocaleString('ar-SA')} {currency}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-brand text-sm font-bold">
                  <span>الخصم ({appliedCoupon.code})</span>
                  <span>- {appliedCoupon.discountAmount.toLocaleString('ar-SA')} {currency}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground text-sm">
                <span>رسوم التوصيل</span>
                {isFreeShipping ? (
                  <span className="font-bold text-brand">مجاني</span>
                ) : (
                  <span className="font-bold">{baseShippingFee.toLocaleString('ar-SA')} {currency}</span>
                )}
              </div>
              
              <div className="flex justify-between font-black text-xl text-foreground pt-4 border-t border-black/10 mt-3">
                <span>الإجمالي المتوقع</span>
                <span className="text-brand">{finalTotal.toLocaleString('ar-SA')} {currency}</span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2 mt-4">
                <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>لا تدفع الآن:</strong> سنتواصل معك لتأكيد توفر المنتجات في المخزن وطريقة الدفع المناسبة قبل الشحن.
                </span>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  )
}
