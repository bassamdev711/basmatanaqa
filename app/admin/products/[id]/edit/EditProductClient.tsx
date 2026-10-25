'use client'

import { startTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { Info, ImageIcon, Settings, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { updateProduct } from '../../actions'
import { getSubCategories } from '../../../collections/actions'
import ImageUpload from '../../ImageUpload'
import SizeSelector from '../../SizeSelector'
import SeoOptimization from '@/components/admin/seo/SeoOptimization'
import { calculateSeoScore, SeoEvaluationData } from '@/lib/seo/score'
import { toast } from 'react-hot-toast'
import { useFormStatus } from 'react-dom'

interface CollectionOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  price: number
  compareAtPrice: number | null
  sku: string | null
  size: string | null
  gender: string | null
  category: string | null
  collectionId: string | null
  subCategoryId: string | null
  subCategoryIds?: string[]
  hasSizes: boolean
  availableSizes: string[]
  supplierId: string | null
  costPrice: number | null
  stock: number
  featured: boolean
  bestseller: boolean
  isActive: boolean
  imageUrl: string | null
  images: string[]
  seoSearchPhrases: string[]
  seoScore: number | null
}

function SubmitButtons() {
  const { pending } = useFormStatus()
  return (
    <div className="flex gap-3">
      <button 
        type="submit" 
        disabled={pending} 
        className="btn btn-primary btn-lg disabled:opacity-50 text-sm font-bold px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl shadow-md transition-all active:scale-95"
      >
        {pending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}

export default function EditProductClient({ 
  product, 
  collections = [], 
  suppliers = [],
  initialSubCategories = [],
  returnUrl = '',
}: { 
  product: Product, 
  collections?: CollectionOption[], 
  suppliers?: CollectionOption[],
  initialSubCategories?: CategoryOption[],
  returnUrl?: string
}) {
  const [mainImage, setMainImage] = useState(product.imageUrl || '')
  const [extraImages, setExtraImages] = useState<string[]>(product.images || [])
  const [name, setName] = useState(product.name || '')
  const [price, setPrice] = useState(product.price != null ? String(product.price) : '')
  const [stock, setStock] = useState(product.stock != null ? String(product.stock) : '10')
  const [costPrice, setCostPrice] = useState(product.costPrice != null ? String(product.costPrice) : '')
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPrice != null ? String(product.compareAtPrice) : '')
  const [slug, setSlug] = useState(product.slug || '')
  const [sku, setSku] = useState(product.sku || '')
  const [description, setDescription] = useState(product.description || '')
  
  // Collections & Subcategories State
  const [selectedCollection, setSelectedCollection] = useState(product.collectionId || '')
  const [subCategories, setSubCategories] = useState<CategoryOption[]>(initialSubCategories)
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    product.subCategoryIds && product.subCategoryIds.length > 0 
      ? product.subCategoryIds 
      : (product.subCategoryId ? [product.subCategoryId] : [])
  )
  const [selectedSupplier, setSelectedSupplier] = useState(product.supplierId || '')

  // Sizes State
  const [hasSizes, setHasSizes] = useState(product.hasSizes || false)
  const [availableSizes, setAvailableSizes] = useState<string[]>(product.availableSizes || [])
  const [seoPhrases, setSeoPhrases] = useState<string[]>(product.seoSearchPhrases || [])
  const [seoScore, setSeoScore] = useState<number>(product.seoScore || 0)
  
  // Toggles
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showStockAndSupplier, setShowStockAndSupplier] = useState(false)

  const toggleSubCategory = (id: string) => {
    setSelectedSubCategories(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      if (error === 'duplicate_slug') {
        toast.error('عفواً، اسم المنتج أو الرابط مستخدم لمنتج آخر. يرجى تغييره وحاول مرة أخرى.', { duration: 5000 })
      } else if (error === 'invalid_subcategory') {
        toast.error('عفواً، المجموعة الفرعية المختارة لا تتبع المجموعة الرئيسية.')
      } else if (error) {
        toast.error('حدث خطأ غير متوقع أثناء الحفظ.')
      }
    }
  }, [])

  // When collection changes, fetch new subcategories if different from initial
  useEffect(() => {
    if (!selectedCollection) {
      setSubCategories([])
      setSelectedSubCategories([])
      return
    }

    if (selectedCollection === product.collectionId && initialSubCategories.length > 0) {
      setSubCategories(initialSubCategories)
      return
    }

    startTransition(() => {
      getSubCategories(selectedCollection).then(data => {
        if (Array.isArray(data)) {
          setSubCategories(data.map(c => ({ id: c.id, name: c.name })))
          // If changing away from original collection, reset selected subcategories
          if (selectedCollection !== product.collectionId) {
            setSelectedSubCategories([])
          }
        }
      }).catch(console.error)
    })
  }, [selectedCollection, product.collectionId, initialSubCategories])

  const generateSlug = (name: string) => {
    let generated = name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!generated) {
      generated = `product-${Math.random().toString(36).substring(2, 8)}`
    }
    return generated
  }

  const generateSKU = () => {
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase()
    setSku(`SKU-${randomString}`)
  }

  const backDestination = returnUrl || '/admin/products'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">تعديل: {product.name}</h2>
        <Link href={backDestination} className="text-sm text-gray-500 hover:text-gray-900 font-bold">
          العودة
        </Link>
      </div>

      <form action={updateProduct} className="space-y-6">
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="returnUrl" value={returnUrl} />
        {!showStockAndSupplier && <input type="hidden" name="stock" value={stock || '10'} />}
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

        {/* --- 2. المعلومات الأساسية مع المساعدات الذكية --- */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={name} 
                onChange={e => {
                  setName(e.target.value)
                  if (!slug || slug === generateSlug(product.name)) {
                    setSlug(generateSlug(e.target.value))
                  }
                }}
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
              />
              
              {/* كلمات مساعدة سريعة لاسم المنتج */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 font-bold ml-1">اقتراحات سريعة:</span>
                {[
                  'فستان نسائي',
                  'فستان بناتي',
                  'طقم ولادي',
                  'بجامة ولادي',
                  'بجامة بناتي',
                  'طقم بناتي',
                  'طقم نسائي',
                  'بنطال نسائي',
                  'بنطال بناتي',
                  'بنطال ولادي',
                  'طقم مواليد',
                  'توب نسائي',
                  'قطعة نسائي',
                ].map((phrase) => {
                  const isSelected = name.trim() === phrase
                  return (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setName(phrase)
                        if (!slug || slug === generateSlug(product.name)) {
                          setSlug(generateSlug(phrase))
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border select-none ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 active:bg-amber-100 text-gray-800 border-gray-200 hover:scale-105'
                      }`}
                    >
                      {phrase}
                    </button>
                  )
                })}
                {name && (
                  <button
                    type="button"
                    onClick={() => setName('')}
                    className="text-[11px] text-red-500 hover:underline px-1.5 font-bold mr-auto"
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            {/* السعر */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ر.ي) *</label>
              <input 
                type="number" 
                name="price" 
                step="0.01" 
                min="0" 
                required 
                value={price}
                onChange={e => setPrice(e.target.value)} 
                dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black font-bold" 
              />
              
              {/* أزرار مساعدة سريعة للأسعار من 500 إلى 5000 بزيادة 250 */}
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto p-1.5 bg-gray-50/80 rounded-xl border border-gray-200">
                {[
                  '500', '750', '1000', '1250', '1500', '1750', '2000', '2250',
                  '2500', '2750', '3000', '3250', '3500', '3750', '4000', '4250',
                  '4500', '4750', '5000'
                ].map((presetPrice) => (
                  <button
                    key={presetPrice}
                    type="button"
                    onClick={() => setPrice(presetPrice)}
                    className={`px-2 py-1 rounded-lg text-xs font-black transition-all border ${
                      price === presetPrice
                        ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                        : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-300'
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
              <select 
                name="collectionId" 
                value={selectedCollection} 
                onChange={(e) => setSelectedCollection(e.target.value)} 
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">بدون مجموعة</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* المجموعات الفرعية المتعددة بنظام الأزرار والـ Checkmarks */}
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
                  {/* Hidden inputs so standard form submit sends all selected subcategories */}
                  {selectedSubCategories.map((id) => (
                    <input key={id} type="hidden" name="subCategoryIds" value={id} />
                  ))}
                  {selectedSubCategories.length > 0 && (
                    <input type="hidden" name="subCategoryId" value={selectedSubCategories[0]} />
                  )}
                </div>
              )}
            </div>

            {/* زر القائمة المنسدلة لإظهار/إخفاء الكمية المتوفرة والمورد وسعر التكلفة */}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200 animate-in fade-in duration-200">
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
                      className="w-full rounded-lg border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="">بدون مورد</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">سعر التكلفة (ر.ي)</label>
                    <input 
                      type="number" 
                      name="costPrice" 
                      step="0.01" 
                      min="0" 
                      dir="ltr" 
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      placeholder="للحساب الداخلي"
                      className="w-full rounded-lg border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
                    />
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
            <textarea 
              name="description" 
              rows={4} 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
            />
          </div>
        </div>

        {/* --- حالة الظهور والتمييز --- */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
            حالة الظهور والتمييز
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" value="on" defaultChecked={product.isActive} className="h-4 w-4 rounded text-black focus:ring-black" />
              <span className="text-sm font-bold text-gray-700">فعال (يظهر في المتجر)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" value="on" defaultChecked={product.featured} className="h-4 w-4 rounded text-black focus:ring-black" />
              <span className="text-sm font-bold text-gray-700">منتج مميز (يظهر في الصفحة الرئيسية)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="bestseller" value="on" defaultChecked={product.bestseller} className="h-4 w-4 rounded text-black focus:ring-black" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">نهاية رابط المنتج (Slug) *</label>
                <div className="flex rounded-md shadow-sm" dir="ltr">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm bg-gray-50">
                    /products/
                  </span>
                  <input 
                    type="text" 
                    name="slug" 
                    required 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" 
                  />
                </div>
                <button type="button" onClick={() => setSlug(generateSlug(name))} className="text-xs text-blue-600 mt-1 hover:underline">
                  توليد الرابط من الاسم الحالي
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز التخزين (SKU)</label>
                <div className="flex gap-2" dir="ltr">
                  <input 
                    type="text" 
                    name="sku" 
                    value={sku} 
                    onChange={e => setSku(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" 
                  />
                  <button type="button" onClick={generateSKU} className="btn btn-secondary whitespace-nowrap">
                    توليد تلقائي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر قبل الخصم</label>
                <input 
                  type="number" 
                  name="compareAtPrice" 
                  step="0.01" 
                  min="0" 
                  value={compareAtPrice}
                  onChange={e => setCompareAtPrice(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الماركة</label>
                <input 
                  type="text" 
                  name="brand" 
                  defaultValue={product.brand || ''}
                  className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                  <select name="gender" defaultValue={product.gender || ''} className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white">
                    <option value="">غير محدد</option>
                    <option value="Men">رجالي</option>
                    <option value="Women">نسائي</option>
                    <option value="Unisex">للجميع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحجم</label>
                  <input 
                    type="text" 
                    name="size" 
                    defaultValue={product.size || ''} 
                    placeholder="مثال: 100ml" 
                    dir="ltr" 
                    className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" 
                  />
                </div>
              </div>
            </div>

            {/* SEO Optimization Section inside Advanced */}
            <div className="border-t pt-4 -mx-6 -mb-6">
              <SeoOptimization 
                title={name}
                description={description}
                hasImage={!!mainImage}
                initialPhrases={product.seoSearchPhrases || []}
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

        {/* Action Buttons: حفظ والعودة بدقة إلى حيث كان المستخدم */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 pt-2 border-t border-gray-200">
          <Link href={backDestination} className="btn btn-outline text-sm font-bold text-gray-600">
            إلغاء والعودة
          </Link>
          <SubmitButtons />
        </div>
      </form>
    </div>
  )
}
