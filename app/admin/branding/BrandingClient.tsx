'use client'

import { startTransition, useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { uploadOgImage, uploadFavicon, saveStoreUrl, saveStoreBranding } from './actions'
import { Image as ImageIcon, Globe, QrCode, Upload, CheckCircle, AlertCircle, Download, Loader2, Save } from 'lucide-react'

interface BrandingClientProps {
  initial: {
    ogImageUrl?: string | null
    faviconUrl?: string | null
    storeUrl?: string | null
    storeName?: string | null
    storeNameLatin?: string | null
    storeTagline?: string | null
    storeDescription?: string | null
    logoUrl?: string | null
    locale?: string | null
    currencyCode?: string | null
  }
}

export default function BrandingClient({ initial }: BrandingClientProps) {
  const [ogPreview, setOgPreview] = useState<string | null>(initial.ogImageUrl || null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(initial.faviconUrl || null)
  const [storeUrl, setStoreUrl] = useState(initial.storeUrl || '')
  const [storeName, setStoreName] = useState(initial.storeName || 'شهرزاد')
  const [storeNameLatin, setStoreNameLatin] = useState(initial.storeNameLatin || 'SHAHRAZAD')
  const [storeTagline, setStoreTagline] = useState(initial.storeTagline || '')
  const [storeDescription, setStoreDescription] = useState(initial.storeDescription || '')
  const [locale, setLocale] = useState(initial.locale || 'ar')
  const [currencyCode, setCurrencyCode] = useState(initial.currencyCode || 'YER')
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [qrColor, setQrColor] = useState('#1a544a')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  
  const [ogLoading, setOgLoading] = useState(false)
  const [faviconLoading, setFaviconLoading] = useState(false)
  const [urlLoading, setUrlLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const ogRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const generateQr = async (url: string, logoUrl?: string | null, color: string = '#1a544a') => {
    if (!url) return
    setQrLoading(true)
    try {
      // 1. Generate base QR as data URL (H = 30% error correction so logo won't break it)
      const baseDataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
        color: { dark: color, light: '#F9F7F2' },
        errorCorrectionLevel: 'H',
      })

      // 2. Composite logo on top using Canvas
      const finalDataUrl = await overlayLogoOnQr(baseDataUrl, logoUrl || faviconPreview, color)
      setQrDataUrl(finalDataUrl)
    } catch (e) {
      console.error('QR generation failed', e)
    }
    setQrLoading(false)
  }

  /** Draws the QR image on a canvas and overlays the logo (or generic store fallback) in the center */
  const overlayLogoOnQr = (qrDataUrl: string, logoSrc?: string | null, color: string = '#1a544a'): Promise<string> => {
    return new Promise((resolve) => {
      const qrImg = new window.Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.onload = () => {
        const size = qrImg.width // 800
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!

        // Draw QR base
        ctx.drawImage(qrImg, 0, 0, size, size)

        // Logo area: 20% of QR size → 160px for 800px QR
        const logoAreaSize = Math.round(size * 0.20)
        const cx = size / 2
        const cy = size / 2
        const radius = logoAreaSize / 2

        const drawFinish = () => {
          resolve(canvas.toDataURL('image/png'))
        }

        const drawLogo = (img: HTMLImageElement | null) => {
          // White circle backdrop with shadow
          ctx.save()
          ctx.shadowColor = 'rgba(0,0,0,0.18)'
          ctx.shadowBlur = 14
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2)
          ctx.fillStyle = '#F9F7F2'
          ctx.fill()
          ctx.restore()

          // Fine border ring in brand dark green
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.restore()

          if (img) {
            // Clip to circle and draw logo — no padding, fills the full circle
            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.clip()
            ctx.drawImage(img, cx - radius, cy - radius, logoAreaSize, logoAreaSize)
            ctx.restore()
          } else {
            // Fallback: draw the configured store mark in the brand font
            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.font = `bold ${Math.round(logoAreaSize * 0.38)}px 'Georgia', serif`
            ctx.fillStyle = '#F9F7F2'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(storeNameLatin.slice(0, 4), cx, cy)
            ctx.restore()
          }
          drawFinish()
        }

        if (logoSrc) {
          const logoImg = new window.Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.onload = () => drawLogo(logoImg)
          logoImg.onerror = () => drawLogo(null) // fallback to the configured store mark
          logoImg.src = logoSrc
        } else {
          drawLogo(null)
        }
      }
      qrImg.onerror = () => resolve(qrDataUrl) // safety: return original on error
      qrImg.src = qrDataUrl
    })
  }

  const generateQrRef = useRef(generateQr)

  // Generate QR on load if storeUrl exists
  useEffect(() => {
    if (initial.storeUrl) {
      startTransition(() => {
        void generateQrRef.current(initial.storeUrl!, initial.faviconUrl, qrColor)
      })
    }
  }, [initial.faviconUrl, initial.storeUrl, qrColor])

  const handleOgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOgPreview(URL.createObjectURL(file))
    setOgLoading(true)
    const fd = new FormData()
    fd.append('ogImage', file)
    const res = await uploadOgImage(fd)
    if (res.success) {
      showToast('تم رفع صورة المشاركة بنجاح ✅', 'success')
      setOgPreview(res.url!)
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setOgLoading(false)
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFaviconPreview(URL.createObjectURL(file))
    setFaviconLoading(true)
    const fd = new FormData()
    fd.append('favicon', file)
    const res = await uploadFavicon(fd)
    if (res.success) {
      showToast('تم رفع الأيقونة بنجاح ✅', 'success')
      setFaviconPreview(res.url!)
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setFaviconLoading(false)
  }

  const handleSaveBranding = async () => {
    setBrandingLoading(true)
    const res = await saveStoreBranding({
      storeName,
      storeNameLatin,
      storeTagline,
      storeDescription,
      locale,
      currencyCode,
    })
    if (res.success) {
      showToast('تم حفظ إعدادات المتجر بنجاح', 'success')
    } else {
      showToast(res.error || 'حدث خطأ أثناء الحفظ', 'error')
    }
    setBrandingLoading(false)
  }

  const handleSaveUrl = async () => {
    if (!storeUrl) return
    setUrlLoading(true)
    const res = await saveStoreUrl(storeUrl)
    if (res.success) {
      showToast('تم حفظ رابط المتجر بنجاح ✅', 'success')
      await generateQr(storeUrl, faviconPreview, qrColor)
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setUrlLoading(false)
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${storeNameLatin.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'store'}-qrcode-hd.png`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الهوية البصرية</h1>
        <p className="text-gray-500 text-sm mt-1">تحكم في صورة متجرك عند المشاركة وأيقونة المتصفح وكود QR</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={['fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-bold transition-all animate-in fade-in slide-in-from-top-4', toast.type === 'success' ? 'bg-brand text-white' : 'bg-red-600 text-white'].join(' ')}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* 1. Store settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand/5 rounded-lg text-brand">
            <Save size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">إعدادات المتجر العامة</h2>
            <p className="text-xs text-gray-500 mt-0.5">هذه البيانات هي أساس القالب ويمكن تغييرها لأي علامة تجارية.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">اسم المتجر بالعربية</span>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} maxLength={80} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors" />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">الاسم اللاتيني</span>
            <input value={storeNameLatin} onChange={(e) => setStoreNameLatin(e.target.value)} maxLength={80} dir="ltr" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-gray-700">الوصف المختصر</span>
            <input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} maxLength={160} placeholder="منتجات مختارة بعناية، وتجربة تستحق التذكر." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-gray-700">وصف المتجر لمحركات البحث</span>
            <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} maxLength={500} rows={3} placeholder="اكتب وصفًا موجزًا لما يقدمه المتجر." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors resize-y" />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">لغة الواجهة</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">رمز العملة</span>
            <input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} maxLength={3} dir="ltr" placeholder="YER" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors" />
          </label>
        </div>
        <button onClick={handleSaveBranding} disabled={brandingLoading} className="mt-6 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors disabled:opacity-60">
          {brandingLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {brandingLoading ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر'}
        </button>
      </div>

      {/* 2. OG Image */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <ImageIcon size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">صورة المشاركة (Open Graph)</h2>
            <p className="text-xs text-gray-500 mt-0.5">تظهر عند مشاركة رابط متجرك على Telegram, WhatsApp, X...</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="w-full md:w-80 h-44 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 relative">
            {ogPreview ? (
              <Image src={ogPreview} alt="OG Preview" fill className="object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">لا توجد صورة</p>
              </div>
            )}
            {ogLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-brand" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 leading-relaxed">
              <strong>المواصفات المثالية:</strong> حجم 1200 × 630 بكسل، صيغة PNG أو JPG، حجم أقل من 1 ميغابايت
            </div>
            <input
              ref={ogRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleOgUpload}
            />
            <button
              onClick={() => ogRef.current?.click()}
              disabled={ogLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Upload size={16} />
              {ogLoading ? 'جاري الرفع...' : 'رفع صورة جديدة'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Favicon */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">أيقونة المتصفح (Favicon)</h2>
            <p className="text-xs text-gray-500 mt-0.5">الأيقونة الصغيرة التي تظهر في تبويب المتصفح بجانب اسم الموقع</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 relative">
            {faviconPreview ? (
              <Image src={faviconPreview} alt="Favicon Preview" fill className="object-contain p-2" />
            ) : (
              <Globe size={28} className="text-gray-300" />
            )}
            {faviconLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-brand" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-700 leading-relaxed">
              <strong>المواصفات المثالية:</strong> حجم 512 × 512 بكسل، صيغة PNG أو ICO، خلفية شفافة تفضيلاً
            </div>
            <input
              ref={faviconRef}
              type="file"
              accept="image/png,image/x-icon,image/jpeg"
              className="hidden"
              onChange={handleFaviconUpload}
            />
            <button
              onClick={() => faviconRef.current?.click()}
              disabled={faviconLoading}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              <Upload size={16} />
              {faviconLoading ? 'جاري الرفع...' : 'رفع أيقونة جديدة'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. QR Code */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand/5 rounded-lg text-brand">
            <QrCode size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">كود QR عالي الدقة</h2>
            <p className="text-xs text-gray-500 mt-0.5">قم بمسحه بأي كاميرا للوصول لمتجرك مباشرة — مثالي للمطبوعات والبطاقات</p>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            placeholder="https://example-store.com"
            dir="ltr"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
          />
          <button
            onClick={handleSaveUrl}
            disabled={urlLoading || !storeUrl}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {urlLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ وتوليد
          </button>
        </div>

        {/* QR Preview */}
        {qrLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={40} className="animate-spin text-brand" />
          </div>
        )}

        {qrDataUrl && !qrLoading && (
          <div className="flex flex-col md:flex-row gap-8 items-start mt-8">
            <div className="bg-[#F9F7F2] p-6 rounded-xl border border-gray-100 flex-shrink-0">
              <Image src={qrDataUrl} alt="QR Code" width={220} height={220} />
            </div>
            <div className="space-y-6 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تخصيص لون الباركود</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  اختر لوناً يتناسب مع هوية المتجر (مثال: ذهبي لرمضان، أو أخضر داكن لهوية المتجر، أحمر لخصومات نهاية العام). سيتم دمج لون الكود مع إطار الصورة في المنتصف.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  كود QR بدقة <strong>800 × 800 بكسل</strong>. يعمل مع كاميرا أي جهاز دون الحاجة لتطبيق خاص.
                </p>
                <button
                  onClick={handleDownloadQr}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-gray-700 transition-colors"
                >
                  <Download size={16} />
                  تنزيل PNG عالي الدقة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
