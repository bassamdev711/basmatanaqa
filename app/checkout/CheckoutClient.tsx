'use client'

import React, { useEffect, useState, useSyncExternalStore, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, AlertCircle, UploadCloud, Copy } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { useCheckout } from '@/components/CheckoutProvider'
import { getPaymentMethods } from './actions'
import { createOrder } from './actions'
import { useCurrency } from '@/components/CurrencyProvider'
import { compressImageClientSide } from '@/lib/compress'

type ShippingCity = { id: string; name: string; shippingFee: number }
type BankAccount = { id: string; bankName: string; accountName: string; accountNumber: string }
type DigitalWallet = { id: string; walletName: string; accountNumber: string }
type PaymentSettingsResponse = {
  settings: {
    codEnabled: boolean
    bankTransferEnabled: boolean
    walletsEnabled: boolean
    codFee: number
  } | null
  storeSettings: { shippingFee: number; freeShippingThreshold: number }
  shippingCities: ShippingCity[]
  bankAccounts: BankAccount[]
  digitalWallets: DigitalWallet[]
}

const emptySubscribe = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export default function CheckoutClient() {
  const currency = useCurrency()

  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, appliedCoupon } = useCart()
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
  
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const idempotencyKeyRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const [formData, setFormData] = useState(checkoutData)

  useEffect(() => {
    getPaymentMethods().then(data => {
      if (!data) {
        throw new Error('No data returned');
      }
      setPaymentSettings(data)
      setFormData(prev => {
        const availableMethods = [
          data.settings?.bankTransferEnabled && data.bankAccounts.length > 0 ? 'bank_transfer' : null,
          data.settings?.walletsEnabled && data.digitalWallets.length > 0 ? 'wallets' : null,
          data.settings?.codEnabled ? 'cod' : null,
        ].filter((method): method is string => Boolean(method))

        return {
          ...prev,
          governorate: 'إب',
          city: data.shippingCities.find((city) => city.name === prev.city)?.name
            || data.shippingCities[0]?.name
            || '',
          paymentMethod: availableMethods.includes(prev.paymentMethod) ? prev.paymentMethod : (availableMethods[0] || ''),
        }
      })
    }).catch(err => {
      console.error('Failed to load payment methods:', err);
      setError('حدث خطأ أثناء تحميل إعدادات الدفع. يرجى تحديث الصفحة أو المحاولة لاحقاً.');
      // Provide fallback so it doesn't stay blank
      setPaymentSettings({
        settings: { codEnabled: false, bankTransferEnabled: false, walletsEnabled: false, codFee: 0 },
        storeSettings: { shippingFee: 0, freeShippingThreshold: 0 },
        shippingCities: [{ id: 'default-ibb', name: 'إب', shippingFee: 0 }],
        bankAccounts: [],
        digitalWallets: []
      });
    })
  }, [formData.paymentMethod])

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
        <p className="mb-8">قم بإضافة منتجات للسلة أولاً للمتابعة للدفع.</p>
        <Link href="/products" className="btn btn-primary btn-lg rounded-sm">
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const storeSettings = paymentSettings.storeSettings;
  const shippingCities = paymentSettings.shippingCities || [];
  const hasAvailablePaymentMethod = Boolean(
    (paymentSettings.settings?.bankTransferEnabled && paymentSettings.bankAccounts.length > 0) ||
    (paymentSettings.settings?.walletsEnabled && paymentSettings.digitalWallets.length > 0) ||
    paymentSettings.settings?.codEnabled
  )
  const hasAvailableCity = shippingCities.length > 0
  
  let baseShippingFee = storeSettings.shippingFee;
  if (shippingCities.length > 0) {
    const selectedCity = shippingCities.find((c: ShippingCity) => c.name === formData.city);
    if (selectedCity) baseShippingFee = selectedCity.shippingFee;
  }

  const isFreeShipping = storeSettings.freeShippingThreshold > 0 && cartTotal >= storeSettings.freeShippingThreshold;
  let shippingFee = isFreeShipping ? 0 : baseShippingFee;
  
  // COD Fee logic
  let codFee = 0;
  const configuredCodFee = paymentSettings.settings?.codFee ?? 0;
  if (formData.paymentMethod === 'cod' && configuredCodFee > 0) {
    codFee = Number(configuredCodFee);
    shippingFee += codFee;
  }

  const finalTotal = Math.max(0, cartTotal - (appliedCoupon?.discountAmount || 0)) + shippingFee;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // Optional: Add a small local toast or indication
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!hasAvailableCity) {
      setError('لا توجد مدينة توصيل متاحة حالياً. يرجى التواصل مع المتجر أو المحاولة لاحقاً.')
      return
    }
    if (!hasAvailablePaymentMethod) {
      setError('لا توجد طريقة دفع متاحة حالياً. يرجى التواصل مع المتجر أو المحاولة لاحقاً.')
      return
    }

    const requiresReceipt = ['bank_transfer', 'wallets'].includes(formData.paymentMethod)
    if (requiresReceipt && !file) {
      setError('الرجاء إرفاق صورة إشعار التحويل لإتمام الطلب')
      return
    }

    setIsSubmitting(true)
    setError('')
    setCheckoutData({ ...formData, shippingFee })

    try {
      const requestKey = idempotencyKeyRef.current
        || window.sessionStorage.getItem('tif_checkout_request')
        || window.crypto.randomUUID()
      idempotencyKeyRef.current = requestKey
      window.sessionStorage.setItem('tif_checkout_request', requestKey)

      const result = await createOrder(
        { ...formData, shippingFee },
        cartItems,
        cartTotal,
        appliedCoupon?.code,
        undefined,
        transactionId,
        requestKey,
      )

      if (!result.success || !result.orderId) {
        setError(result.error || 'حدث خطأ ما أثناء إنشاء الطلب')
        setIsSubmitting(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (requiresReceipt && file) {
        if (!result.paymentUploadToken) {
          throw new Error('تعذر تجهيز رفع إيصال الدفع للطلب')
        }

        const compressedFile = await compressImageClientSide(file)
        const uploadFormData = new FormData()
        uploadFormData.append('file', compressedFile)
        uploadFormData.append('orderId', result.orderId)
        uploadFormData.append('uploadToken', result.paymentUploadToken)
        if (transactionId.trim()) uploadFormData.append('transactionId', transactionId.trim())

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        if (!uploadRes.ok) {
          throw new Error('تم إنشاء الطلب، لكن تعذر رفع الإيصال. أعد المحاولة لإرفاقه بالطلب.')
        }
      }

      window.sessionStorage.removeItem('tif_checkout_request')
      clearCart()
      if (!result.trackingToken) {
        throw new Error('تعذر تجهيز رابط التتبع الآمن للطلب')
      }
      router.push(`/checkout/success/${result.orderId}?token=${encodeURIComponent(result.trackingToken)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      setIsSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex-grow pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto w-full">
      <div className="mb-4 md:mb-8">
          <Link href="/cart" className="inline-flex items-center text-foreground/60 hover:text-brand transition-colors font-bold gap-2 text-sm">
            <ArrowRight size={15} />
            العودة إلى السلة
          </Link>
        </div>
        
        <h1 className="text-xl md:text-5xl font-black text-foreground mb-5 md:mb-10">إتمام الطلب</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-8 border border-red-200 font-bold flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-16">
          
          {/* Right Column: Form */}
          <div className="md:col-span-7 order-2 md:order-1">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-12">
              {/* Shipping Details */}
              <section>
                <h2 className="text-base md:text-2xl font-bold text-foreground mb-4 md:mb-8 flex items-center gap-2">
                  <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs md:text-sm">1</span>
                  تفاصيل الشحن
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-8">
                  <div className="flex flex-col">
                    <label htmlFor="fullName" className="text-sm font-bold text-foreground/70 mb-2">الاسم الكامل</label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="أدخل اسمك الكامل"
                      className="bg-transparent border-b border-black/20 pb-3 outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="phone" className="text-sm font-bold text-foreground/70 mb-2">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      dir="ltr"
                      placeholder="05XXXXXXXX"
                      className="bg-transparent border-b border-black/20 pb-3 outline-none focus:border-brand transition-colors text-right"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="governorate" className="text-sm font-bold text-foreground/70 mb-2">المحافظة</label>
                    <select 
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleChange}
                      required
                      className="bg-transparent border-b border-black/20 pb-3 outline-none focus:border-brand transition-colors appearance-none"
                    >
                      <option value="إب">إب</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-foreground/70 mb-2">المدينة</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      disabled={shippingCities.length === 0}
                      className="bg-transparent border-b border-black/20 pb-3 outline-none focus:border-brand transition-colors appearance-none disabled:opacity-60"
                    >
                      <option value="" disabled>اختر المدينة</option>
                      {shippingCities.map((city: ShippingCity) => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-bold text-foreground/70 mb-2">تفاصيل العنوان</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="اسم الشارع، رقم المبنى، الحي"
                      className="bg-transparent border-b border-black/20 pb-3 outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section>
                <h2 className="text-base md:text-2xl font-bold text-foreground mb-4 md:mb-8 flex items-center gap-2">
                  <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs md:text-sm">2</span>
                  طريقة الدفع
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {!hasAvailablePaymentMethod && (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-md p-4 text-sm font-bold">
                      لا توجد طرق دفع متاحة حالياً. يرجى التواصل مع المتجر لإتمام الطلب.
                    </div>
                  )}
                  {paymentSettings.settings?.bankTransferEnabled && paymentSettings.bankAccounts.length > 0 && (
                    <label className={`flex items-start p-3 md:p-6 border ${formData.paymentMethod === 'bank_transfer' ? 'border-brand bg-white shadow-sm' : 'border-black/10'} cursor-pointer transition-all hover:bg-black/5`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={handleChange}
                        className="mt-0.5 accent-brand w-4 h-4 md:w-5 md:h-5"
                      />
                      <div className="mr-3 md:mr-4 w-full">
                        <div className="text-sm md:text-lg font-bold text-foreground">تحويل بنكي</div>
                        <div className="text-xs md:text-sm text-foreground/70 mt-0.5">تحويل مباشر إلى حسابنا البنكي.</div>
                        
                        {formData.paymentMethod === 'bank_transfer' && (
                          <div className="mt-4 pt-4 border-t border-black/10 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-brand mb-3 uppercase">الحسابات البنكية المتاحة</h4>
                            <div className="space-y-4 mb-6">
                              {paymentSettings.bankAccounts.map((bank: BankAccount) => (
                                <div key={bank.id} className="bg-surface-alt p-3 rounded-md border border-black/5">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-foreground/70">اسم البنك</span>
                                    <span className="font-bold text-sm">{bank.bankName}</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-foreground/70">اسم الحساب</span>
                                    <span className="font-bold text-sm">{bank.accountName}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                                    <span className="text-xs text-foreground/70">رقم الحساب / الآيبان</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm tracking-wider" dir="ltr">{bank.accountNumber}</span>
                                      <button type="button" onClick={(e) => { e.preventDefault(); handleCopy(bank.accountNumber); }} className="text-brand hover:text-foreground transition-colors" title="نسخ">
                                        <Copy size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {paymentSettings.bankAccounts.length === 0 && (
                                <p className="text-xs text-red-500">لا توجد حسابات بنكية مضافة حالياً.</p>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-foreground mb-2">صورة إشعار التحويل <span className="text-red-500">*</span></label>
                                {previewUrl ? (
                                  <div className="relative border-2 border-brand/20 rounded-md p-2 bg-brand/5 flex flex-col items-center justify-center">
                                    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden mb-3 bg-black/5">
                                      <Image src={previewUrl} alt="Receipt Preview" fill className="object-contain" />
                                    </div>
                                    <div className="flex items-center justify-between w-full px-1">
                                      <span className="text-xs font-bold text-brand line-clamp-1" dir="ltr">{file?.name}</span>
                                      <button 
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors flex items-center justify-center"
                                        title="حذف الصورة"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-black/20 hover:border-brand bg-surface-alt p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group rounded-md"
                                  >
                                    <UploadCloud className="w-8 h-8 mb-3 transition-colors text-foreground/40 group-hover:text-brand" />
                                    <p className="text-sm font-bold text-foreground text-center mb-1">
                                      اضغط لرفع صورة الإيصال
                                    </p>
                                    <p className="text-xs text-foreground/50">JPG, PNG، أقصى حجم 5MB</p>
                                  </div>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/jpeg, image/png, image/webp" 
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-foreground mb-1">رقم العملية (اختياري)</label>
                                <input 
                                  type="text" 
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="أدخل رقم العملية المرجعي"
                                  className="w-full bg-surface-alt border border-black/10 rounded-md p-2 text-sm outline-none focus:border-brand transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  {paymentSettings.settings?.walletsEnabled && paymentSettings.digitalWallets.length > 0 && (
                    <label className={`flex items-start p-3 md:p-6 border ${formData.paymentMethod === 'wallets' ? 'border-brand bg-white shadow-sm' : 'border-black/10'} cursor-pointer transition-all hover:bg-black/5`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="wallets"
                        checked={formData.paymentMethod === 'wallets'}
                        onChange={handleChange}
                        className="mt-0.5 accent-brand w-4 h-4 md:w-5 md:h-5"
                      />
                      <div className="mr-3 md:mr-4 w-full">
                        <div className="text-sm md:text-lg font-bold text-foreground">محفظة إلكترونية</div>
                        <div className="text-xs md:text-sm text-foreground/70 mt-0.5">الدفع عبر المحافظ الإلكترونية المعتمدة.</div>

                        {formData.paymentMethod === 'wallets' && (
                          <div className="mt-4 pt-4 border-t border-black/10 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-brand mb-3 uppercase">المحافظ المتاحة</h4>
                            <div className="space-y-4 mb-6">
                              {paymentSettings.digitalWallets.map((wallet: DigitalWallet) => (
                                <div key={wallet.id} className="bg-surface-alt p-3 rounded-md border border-black/5">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-foreground/70">المحفظة</span>
                                    <span className="font-bold text-sm">{wallet.walletName}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                                    <span className="text-xs text-foreground/70">رقم الجوال / الحساب</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm tracking-wider" dir="ltr">{wallet.accountNumber}</span>
                                      <button type="button" onClick={(e) => { e.preventDefault(); handleCopy(wallet.accountNumber); }} className="text-brand hover:text-foreground transition-colors" title="نسخ">
                                        <Copy size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {paymentSettings.digitalWallets.length === 0 && (
                                <p className="text-xs text-red-500">لا توجد محافظ إلكترونية مضافة حالياً.</p>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-foreground mb-2">صورة إشعار التحويل <span className="text-red-500">*</span></label>
                                {previewUrl ? (
                                  <div className="relative border-2 border-brand/20 rounded-md p-2 bg-brand/5 flex flex-col items-center justify-center">
                                    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden mb-3 bg-black/5">
                                      <Image src={previewUrl} alt="Receipt Preview" fill className="object-contain" />
                                    </div>
                                    <div className="flex items-center justify-between w-full px-1">
                                      <span className="text-xs font-bold text-brand line-clamp-1" dir="ltr">{file?.name}</span>
                                      <button 
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors flex items-center justify-center"
                                        title="حذف الصورة"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-black/20 hover:border-brand bg-surface-alt p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group rounded-md"
                                  >
                                    <UploadCloud className="w-8 h-8 mb-3 transition-colors text-foreground/40 group-hover:text-brand" />
                                    <p className="text-sm font-bold text-foreground text-center mb-1">
                                      اضغط لرفع صورة الإيصال
                                    </p>
                                    <p className="text-xs text-foreground/50">JPG, PNG، أقصى حجم 5MB</p>
                                  </div>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/jpeg, image/png, image/webp" 
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-foreground mb-1">رقم العملية (اختياري)</label>
                                <input 
                                  type="text" 
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="أدخل رقم العملية المرجعي"
                                  className="w-full bg-surface-alt border border-black/10 rounded-md p-2 text-sm outline-none focus:border-brand transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  {paymentSettings.settings?.codEnabled && (
                    <label className={`flex items-start p-3 md:p-6 border ${formData.paymentMethod === 'cod' ? 'border-brand bg-white shadow-sm' : 'border-black/10'} cursor-pointer transition-all hover:bg-black/5`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="mt-0.5 accent-brand w-4 h-4 md:w-5 md:h-5"
                      />
                      <div className="mr-3 md:mr-4">
                        <div className="text-sm md:text-lg font-bold text-foreground">الدفع عند الاستلام</div>
                        <div className="text-xs md:text-sm text-foreground/70 mt-0.5">
                          ادفع نقدًا عند استلام طلبك. 
                          {paymentSettings.settings.codFee > 0 && <span className="font-bold text-brand mr-2">(رسوم إضافية: {paymentSettings.settings.codFee} {currency})</span>}
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </section>

              <button 
                type="submit" 
                disabled={isSubmitting || !hasAvailablePaymentMethod || !hasAvailableCity}
                className="btn btn-primary w-full btn-lg gap-3 group !bg-accent !text-foreground hover:!bg-accent/90 border border-black/10 disabled:opacity-50 disabled:cursor-not-allowed md:h-16 h-14 md:text-lg"
              >
                {isSubmitting ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب الآن'}
                {!isSubmitting && <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />}
              </button>
            </form>
          </div>

          {/* Left Column: Order Summary */}
          <aside className="md:col-span-5 order-1 md:order-2 relative">
            <div className="sticky top-20 md:top-32 bg-surface-alt p-4 md:p-8 border border-black/5 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6 border-b border-black/5 pb-4">ملخص الطلب</h2>
              
              <div className="space-y-3 md:space-y-4 mb-5 md:mb-8">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-white shrink-0 border border-black/5 flex items-center justify-center relative overflow-hidden">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover mix-blend-multiply" />
                      ) : (
                        <span className="text-accent">متجرنا</span>
                      )}
                    </div>
                    <div className="flex-grow pt-1">
                      <h4 className="font-bold text-foreground text-sm line-clamp-2">{item.name}</h4>
                      <div className="text-brand text-sm font-bold mt-1">{(item.price).toLocaleString('ar-SA')} {currency}</div>
                      
                      {/* Quantity Control inside Checkout */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-black/10 rounded-sm bg-white">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-black/5 transition-colors text-foreground"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-black/5 transition-colors text-foreground"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/5 pt-6 space-y-4">
                <div className="flex justify-between text-foreground text-sm">
                  <span>المجموع الفرعي</span>
                  <span className="font-bold">{cartTotal.toLocaleString('ar-SA')} {currency}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-brand text-sm font-bold">
                    <span>الخصم ({appliedCoupon.code})</span>
                    <span>- {appliedCoupon.discountAmount.toLocaleString('ar-SA')} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground text-sm">
                  <span>التوصيل</span>
                  {isFreeShipping ? (
                    <span className="font-bold text-brand">مجاني</span>
                  ) : (
                    <span className="font-bold">{baseShippingFee.toLocaleString('ar-SA')} {currency}</span>
                  )}
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between text-foreground text-sm">
                    <span>رسوم الدفع عند الاستلام</span>
                    <span className="font-bold text-brand">{codFee.toLocaleString('ar-SA')} {currency}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-black text-xl text-foreground pt-4 border-t border-black/10 mt-4">
                  <span>الإجمالي</span>
                  <span className="text-brand">{finalTotal.toLocaleString('ar-SA')} {currency}</span>
                </div>
                <div className="text-xs text-center text-foreground/50 mt-2">
                  الأسعار شاملة ضريبة القيمة المضافة
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
  )
}
