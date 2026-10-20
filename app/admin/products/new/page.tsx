'use client'

import { startTransition, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Info, ImageIcon, Settings, ChevronDown, ChevronUp, Zap, Check } from 'lucide-react'
import { createProduct } from '../actions'
import { getCollections, getSubCategories } from '../../collections/actions'
import { getSuppliers } from '../../suppliers/actions'
import ImageUpload from '../ImageUpload'
import SizeSelector from '../SizeSelector'
import SeoOptimization from '@/components/admin/seo/SeoOptimization'
import { useFormStatus } from 'react-dom'
import { calculateSeoScore, SeoEvaluationData } from '@/lib/seo/score'
import { toast } from 'react-hot-toast'
import { useProductQueue } from '../ProductQueueContext'

type CollectionOption = { id: string; name: string }
type CategoryOption = { id: string; name: string }

function SubmitButtons() {
  const { pending } = useFormStatus()
  return (
    <div className="flex gap-3">
      <button type="submit" name="addAnother" value="true" disabled={pending} className="btn btn-secondary btn-lg disabled:opacity-50 text-sm font-bold bg-gray-200 text-gray-800 hover:bg-gray-300">
        {pending ? 'جاري الحفظ...' : 'حفظ وإضافة منتج آخر'}
      </button>
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg disabled:opacity-50 text-sm font-bold">
        {pending ? 'جاري الحفظ...' : 'حفظ وإضافة المنتج'}
      </button>
    </div>
  )
}

export default function NewProductPage() {
  const { addToQueue } = useProductQueue()
  const formRef = useRef<HTMLFormElement>(null)

  const [mainImage, setMainImage] = useState('')
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [slug, setSlug] = useState('')
  const [sku, setSku] = useState('')
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [suppliers, setSuppliers] = useState<CollectionOption[]>([])
  
  // Categories State
  const [subCategories, setSubCategories] = useState<CategoryOption[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')

  // Sizes State
  const [hasSizes, setHasSizes] = useState(false)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('10')
  const [costPrice, setCostPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [description, setDescription] = useState('')
  const [seoPhrases, setSeoPhrases] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showStockAndSupplier, setShowStockAndSupplier] = useState(false)

  const toggleSubCategory = (id: string) => {
    setSelectedSubCategories(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleInstantBackgroundAdd = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('يرجى كتابة اسم المنتج أولاً')
      return
    }
    const numPrice = Number(price)
    if (!price || isNaN(numPrice) || numPrice < 0) {
      toast.error('يرجى إدخال سعر صحيح للمنتج')
      return
    }

    // Add directly to persistent queue
    addToQueue({
      name: name.trim(),
      slug: slug || generateSlug(name),
      price: numPrice,
      stock: stock ? Number(stock) : 10,
      costPrice: costPrice ? Number(costPrice) : null,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      collectionId: selectedCollection || null,
      subCategoryId: selectedSubCategories[0] || null,
      subCategoryIds: selectedSubCategories,
      supplierId: selectedSupplier || null,
      description: description || null,
      mainImageFileUrl: mainImage || undefined,
      extraImageFileUrls: extraImages.length > 0 ? extraImages : undefined,
      sku: sku || undefined,
      hasSizes,
      availableSizes,
      seoSearchPhrases: seoPhrases,
      seoScore,
      isActive: true,
    })

    // Instant reset form without waiting
    setName('')
    setPrice('')
    setCostPrice('')
    setCompareAtPrice('')
    setDescription('')
    setMainImage('')
    setExtraImages([])
    setSelectedSubCategories([])
    setHasSizes(false)
    setAvailableSizes([])
    setSeoPhrases([])
    setSeoScore(0)
    generateSKU()

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' })

    toast.success('⚡ تم إرسال المنتج للطابور وبدء المعالجة في الخلفية!', {
      duration: 3500,
      icon: '🚀',
    })
  }

  const generateSlug = (name: string) => {
    let generated = name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '')
      .toLowerCase()
    
    if (!generated) {
      generated = `product-${Math.random().toString(36).substring(2, 8)}`
    }
    return generated
  }

  const generateSKU = () => {
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase()
    setSku(`SKU-${randomString}`)
  }

  useEffect(() => {
    startTransition(() => {
      getCollections().then(data => {
        if (Array.isArray(data)) setCollections(data.map(c => ({ id: c.id, name: c.name })))
      }).catch(console.error)
      getSuppliers().then(data => {
        if (Array.isArray(data)) {
          setSuppliers(data.filter(s => s.isActive).map(s => ({ id: s.id, name: s.name })))
        }
      }).catch(console.error)
      // Auto-generate initial SKU
      generateSKU()
    })

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const success = params.get('success')
      if (error === 'duplicate_slug') {
        toast.error('عفواً، اسم المنتج أو الرابط مستخدم لمنتج آخر. يرجى تغييره وحاول مرة أخرى.', { duration: 5000 })
      } else if (error) {
        toast.error('حدث خطأ غير متوقع أثناء الحفظ.')
      } else if (success === 'true') {
        toast.success('تمت الإضافة بنجاح! يمكنك إدخال بيانات المنتج التالي الآن.', { duration: 5000 })
        // Remove the query param to prevent toast on refresh
        window.history.replaceState({}, '', '/admin/products/new')
      }
    }
  }, [])

  useEffect(() => {
    if (selectedCollection) {
      startTransition(() => {
        getSubCategories(selectedCollection).then(data => {
          if (Array.isArray(data)) setSubCategories(data.map(c => ({ id: c.id, name: c.name })))
        }).catch(console.error)
      })
    } else {
      setSubCategories([])
    }
  }, [selectedCollection])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">إضافة منتج جديد</h2>
          <Link 
            href="/admin/products/bulk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition-colors border border-amber-300"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>الإضافة المتعددة</span>
          </Link>
        </div>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">العودة</Link>
      </div>

      <form action={createProduct} className="space-y-6">
        {/* Hidden image fields */}
        <input type="hidden" name="imageUrl" value={mainImage} />
        <input type="hidden" name="images" value={JSON.stringify(extraImages)} />
        <input type="hidden" name="seoSearchPhrases" value={JSON.stringify(seoPhrases)} />
        <input type="hidden" name="seoScore" value={seoScore} />
        <input type="hidden" name="hasSizes" value={hasSizes.toString()} />
        <input type="hidden" name="availableSizes" value={JSON.stringify(availableSizes)} />

        {/* --- 1. صورة المنتج الأساسية والصور الإضافية في قمة النموذج --- */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <span>صورة المنتج الأساسية والصور الإضافية *</span>
            </h3>
            <span className="text-xs text-gray-400 font-bold">يمكنك القص، التعديل، وطمس الأسعار بالإصبع</span>
          </div>
          <ImageUpload
            mainImage={mainImage}
            additionalImages={extraImages}
            onMainImageChange={setMainImage}
            onAdditionalImagesChange={setExtraImages}
          />
        </div>

        {/* --- 2. الأقسام الأساسية المرئية دائماً --- */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
              <input type="text" name="name" value={name} required onChange={(e) => {
                setName(e.target.value)
                setSlug(generateSlug(e.target.value))
              }}
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              
              {/* كلمات مساعدة سريعة لاسم المنتج */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 font-bold ml-1">مساعد الاسم:</span>
                {[
                  'فستان',
                  'نسائي',
                  'بنطلون',
                  'جينز',
                  'طقم',
                  'قطعتين',
                  'ولادي',
                  'بناتي',
                  'اطفال',
                  'بيبي',
                  'روب',
                  'سهره',
                ].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      const updated = name.trim() ? `${name.trim()} ${word}` : word
                      setName(updated)
                      setSlug(generateSlug(updated))
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 active:bg-amber-100 text-gray-800 border border-gray-200 transition-all hover:scale-105 select-none"
                  >
                    + {word}
                  </button>
                ))}
                {name && (
                  <button
                    type="button"
                    onClick={() => {
                      setName('')
                      setSlug('')
                    }}
                    className="text-[11px] text-red-500 hover:underline px-1.5 font-bold mr-auto"
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ر.ي) *</label>
              <input type="number" name="price" value={price} onChange={e => setPrice(e.target.value)} step="0.01" min="0" required dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              {/* أزرار مساعدة سريعة للأسعار الشائعة */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['1000', '2000', '2200', '2500', '2700', '3000', '3200', '4000'].map((presetPrice) => (
                  <button
                    key={presetPrice}
                    type="button"
                    onClick={() => setPrice(presetPrice)}
                    className={`px-2 py-1 rounded-lg text-xs font-black transition-all border ${
                      price === presetPrice
                        ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {presetPrice}
                  </button>
                ))}
              </div>
            </div>
            {/* المجموعة الرئيسية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة (Collection)</label>
              <select name="collectionId" value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                <option value="">بدون مجموعة</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* المجموعات الفرعية */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                المجموعات الفرعية (يمكن اختيار أكثر من مجموعة)
              </label>
              {!selectedCollection ? (
                <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                  يرجى اختيار المجموعة الرئيسية أولاً لعرض الفروع المتاحة
                </p>
              ) : subCategories.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  لا توجد فروع مضافة لهذه المجموعة حتى الآن
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {subCategories.map((c) => {
                    const isSelected = selectedSubCategories.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleSubCategory(c.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{c.name}</span>
                      </button>
                    )
                  })}
                  {/* Hidden inputs so standard form submit also sends all selected */}
                  {selectedSubCategories.map((id) => (
                    <input key={id} type="hidden" name="subCategoryIds" value={id} />
                  ))}
                  {selectedSubCategories.length > 0 && (
                    <input type="hidden" name="subCategoryId" value={selectedSubCategories[0]} />
                  )}
                </div>
              )}
            </div>

            {/* زر القائمة المنسدلة لإظهار/إخفاء الكمية المتوفرة والمورد معاً في نفس السطر على الهاتف */}
            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowStockAndSupplier(!showStockAndSupplier)}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <span>الكمية المتوفرة والمورد</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    (الكمية: {stock || 10} {selectedSupplier ? `• المورد: ${suppliers.find(s => s.id === selectedSupplier)?.name || ''}` : ''})
                  </span>
                </span>
                {showStockAndSupplier ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {showStockAndSupplier && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">الكمية المتوفرة</label>
                    <input 
                      type="number" 
                      name="stock" 
                      value={stock} 
                      onChange={e => setStock(e.target.value)} 
                      min="0" 
                      dir="ltr"
                      className="w-full rounded-lg border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black font-bold" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">افتراضياً: 10</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">المورد</label>
                    <select 
                      name="supplierId" 
                      value={selectedSupplier} 
                      onChange={e => setSelectedSupplier(e.target.value)} 
                      className="w-full rounded-lg border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black font-bold"
                    >
                      <option value="">بدون مورد</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-gray-200/60">
                    <label className="block text-xs font-bold text-gray-700 mb-1">سعر التكلفة (من المورد)</label>
                    <input 
                      type="number" 
                      name="costPrice" 
                      value={costPrice} 
                      onChange={e => setCostPrice(e.target.value)} 
                      step="0.01" 
                      min="0" 
                      dir="ltr"
                      className="w-full rounded-lg border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black font-bold" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">لا يظهر للعميل — لحساب الربح فقط</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SizeSelector
            hasSizes={hasSizes}
            onHasSizesChange={setHasSizes}
            availableSizes={availableSizes}
            onChangeSizes={setAvailableSizes}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف التسويقي</label>
            <textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} 
              className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
        </div>

        {/* --- حالة الظهور والتمييز --- */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
            حالة الظهور والتمييز
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" value="on" defaultChecked className="h-4 w-4 rounded text-black focus:ring-black" />
              <span className="text-sm font-bold text-gray-700">فعال (يظهر في المتجر)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" value="on" className="h-4 w-4 rounded text-black focus:ring-black" />
              <span className="text-sm font-bold text-gray-700">منتج مميز (يظهر في الصفحة الرئيسية)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="bestseller" value="on" className="h-4 w-4 rounded text-black focus:ring-black" />
              <span className="text-sm font-bold text-gray-700">الأكثر مبيعاً</span>
            </label>
          </div>
        </div>

        {/* --- الإعدادات المتقدمة (قابلة للطي) --- */}
        <div className="bg-gray-50 shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors text-right"
          >
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" /> إعدادات متقدمة (الفلاتر، الخصومات، الـ SEO)
            </h3>
            {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          
          <div className={`p-6 space-y-8 bg-white border-t border-gray-200 ${showAdvanced ? 'block' : 'hidden'}`}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رابط المشاركة للمنتج (Slug) - اختياري</label>
                  <div className="flex rounded-md shadow-sm" dir="ltr">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm bg-gray-50">
                      /products/
                    </span>
                    <input type="text" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)}
                      placeholder="يُنشأ تلقائياً برقم تسلسلي أو رمز فريد"
                      className="w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    يُترك فارغاً للتوليد التلقائي برقم تسلسلي (-2، -3...) أو رمز مميز عند تكرار الأسماء.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رمز التخزين (SKU)</label>
                  <div className="flex gap-2" dir="ltr">
                    <input type="text" name="sku" value={sku} onChange={e => setSku(e.target.value)}
                      className="flex-1 rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" />
                    <button type="button" onClick={generateSKU} className="btn btn-secondary whitespace-nowrap">
                      توليد تلقائي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر قبل الخصم</label>
                  <input type="number" name="compareAtPrice" step="0.01" min="0" dir="ltr"
                    className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الماركة</label>
                  <input type="text" name="brand" defaultValue=""
                    className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
                </div>



                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                    <select name="gender" className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white">
                      <option value="">غير محدد</option>
                      <option value="Men">رجالي</option>
                      <option value="Women">نسائي</option>
                      <option value="Unisex">للجميع</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحجم</label>
                    <input type="text" name="size" placeholder="مثال: 100ml" dir="ltr" 
                      className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
                  </div>
                </div>
              </div>



              {/* SEO Optimization Section inside Advanced */}
              <div className="border-t pt-4 -mx-6 -mb-6">
                <SeoOptimization 
                  title={name}
                  description={description}
                  hasImage={!!mainImage}
                  onPhrasesChange={(phrases) => {
                    setSeoPhrases(phrases);
                    const scoreData: SeoEvaluationData = {
                      title: name,
                      description,
                      hasImage: !!mainImage,
                      searchPhrases: phrases
                    };
                    const result = calculateSeoScore(scoreData);
                    setSeoScore(result.score);
                  }}
                  entityType="product"
                />
              </div>

            </div>
          </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 pt-2 border-t border-gray-200">
          <Link href="/admin/products" className="btn btn-outline text-sm font-bold text-gray-600">
            العودة للمنتجات
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {/* The Instant 0-delay Background Add Button */}
            <button
              type="button"
              onClick={handleInstantBackgroundAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              title="إضافة فورية وإخلاء النموذج للبدء في المنتج التالي فوراً"
            >
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>إضافة فورية ومتابعة الإدخال ⚡</span>
            </button>
            <SubmitButtons />
          </div>
        </div>
      </form>
    </div>
  )
}
