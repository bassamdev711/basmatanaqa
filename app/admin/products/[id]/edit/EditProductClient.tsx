'use client'

import { startTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { Info, ImageIcon, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { updateProduct } from '../../actions'
import { getSubCategories } from '../../../collections/actions'
import ImageUpload from '../../ImageUpload'
import SeoOptimization from '@/components/admin/seo/SeoOptimization'
import { calculateSeoScore, SeoEvaluationData } from '@/lib/seo/score'
import { toast } from 'react-hot-toast'

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
  hasSizes: boolean
  availableSizes: string[]
  collectionId: string | null
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

export default function EditProductClient({ 
  product, 
  collections = [], 
  suppliers = [],
}: { 
  product: Product, 
  collections?: CollectionOption[], 
  suppliers?: CollectionOption[]
}) {
  const [mainImage, setMainImage] = useState(product.imageUrl || '')
  const [extraImages, setExtraImages] = useState<string[]>(product.images || [])
  const [name, setName] = useState(product.name || '')
  const [slug, setSlug] = useState(product.slug || '')
  const [sku, setSku] = useState(product.sku || '')
  const [description, setDescription] = useState(product.description || '')
  
  // Categories State
  const [subCategories, setSubCategories] = useState<CategoryOption[]>([])
  const [selectedCollection, setSelectedCollection] = useState(product.collectionId || '')

  // Sizes State
  const [hasSizes, setHasSizes] = useState(product.hasSizes || false)
  const [availableSizes, setAvailableSizes] = useState<string[]>(product.availableSizes || [])
  const [currentSizeInput, setCurrentSizeInput] = useState('')

  const [seoPhrases, setSeoPhrases] = useState<string[]>(product.seoSearchPhrases || [])
  const [seoScore, setSeoScore] = useState<number>(product.seoScore || 0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleAddSize = () => {
    if (currentSizeInput.trim() && !availableSizes.includes(currentSizeInput.trim())) {
      setAvailableSizes([...availableSizes, currentSizeInput.trim()])
      setCurrentSizeInput('')
    }
  }

  const handleRemoveSize = (sizeToRemove: string) => {
    setAvailableSizes(availableSizes.filter(s => s !== sizeToRemove))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      if (error === 'duplicate_slug') {
        toast.error('عفواً، اسم المنتج أو الرابط مستخدم لمنتج آخر. يرجى تغييره وحاول مرة أخرى.', { duration: 5000 })
      } else if (error) {
        toast.error('حدث خطأ غير متوقع أثناء الحفظ.')
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, '') // remove arabic chars
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  const generateSKU = () => {
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase()
    setSku(`SKU-${randomString}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">تعديل: {product.name}</h2>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">العودة</Link>
      </div>

      <form action={updateProduct} className="space-y-6">
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="imageUrl" value={mainImage} />
        <input type="hidden" name="images" value={JSON.stringify(extraImages)} />
        <input type="hidden" name="seoSearchPhrases" value={JSON.stringify(seoPhrases)} />
        <input type="hidden" name="seoScore" value={seoScore} />
        <input type="hidden" name="hasSizes" value={hasSizes.toString()} />
        <input type="hidden" name="availableSizes" value={JSON.stringify(availableSizes)} />

        {/* --- الأقسام الأساسية المرئية دائماً --- */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
              <input type="text" name="name" required value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
              <input type="number" name="price" step="0.01" min="0" required defaultValue={product.price} dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتوفرة</label>
              <input type="number" name="stock" min="0" defaultValue={product.stock} dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة (Collection)</label>
              <select name="collectionId" value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                <option value="">بدون مجموعة</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة الفرعية</label>
              <select name="subCategoryId" defaultValue={product.subCategoryId || ''} disabled={!selectedCollection} className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:text-gray-500">
                <option value="">بدون مجموعة فرعية</option>
                {subCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
              <select name="supplierId" defaultValue={product.supplierId || ''} className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                <option value="">بدون مورد</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة (من المورد)</label>
              <input type="number" name="costPrice" step="0.01" min="0" dir="ltr" defaultValue={product.costPrice ?? ''}
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              <p className="text-xs text-gray-500 mt-1">لا يظهر للعميل — لحساب الربح فقط</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input 
                type="checkbox" 
                checked={hasSizes}
                onChange={(e) => setHasSizes(e.target.checked)}
                className="h-5 w-5 rounded text-black focus:ring-black" 
              />
              <span className="text-base font-bold text-gray-900">المنتج يحتوي على مقاسات</span>
            </label>

            {hasSizes && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إضافة مقاس (اضغط إنتر أو انقر إضافة)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={currentSizeInput}
                      onChange={(e) => setCurrentSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSize()
                        }
                      }}
                      placeholder="مثال: XL، 42، كبير..."
                      className="flex-1 rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
                    />
                    <button type="button" onClick={handleAddSize} className="btn btn-secondary px-4">
                      إضافة
                    </button>
                  </div>
                </div>
                
                {availableSizes.length > 0 && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">المقاسات المعتمدة:</span>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => (
                        <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-full">
                          {size}
                          <button type="button" onClick={() => handleRemoveSize(size)} className="hover:text-red-300 focus:outline-none ml-1 font-bold">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف التسويقي</label>
            <textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-500" /> صور المنتج
          </h3>
          <ImageUpload
            mainImage={mainImage}
            additionalImages={extraImages}
            onMainImageChange={setMainImage}
            onAdditionalImagesChange={setExtraImages}
          />
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
          
          {showAdvanced && (
            <div className="p-6 space-y-8 bg-white border-t border-gray-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نهاية رابط المنتج (Slug) *</label>
                  <div className="flex rounded-md shadow-sm" dir="ltr">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm bg-gray-50">
                      https://example-store.com/products/
                    </span>
                    <input type="text" name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)}
                      className="w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" />
                  </div>
                  <button type="button" onClick={() => setSlug(generateSlug(name))} className="text-xs text-blue-600 mt-1 hover:underline">
                    توليد الرابط من الاسم الحالي
                  </button>
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
                  <input type="number" name="compareAtPrice" step="0.01" min="0" defaultValue={product.compareAtPrice ?? ''} dir="ltr"
                    className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الماركة</label>
                  <input type="text" name="brand" defaultValue={product.brand || ''}
                    className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
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
                    <input type="text" name="size" defaultValue={product.size || ''} placeholder="مثال: 100ml" dir="ltr" 
                      className="w-full rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-bold text-gray-700 mb-3">حالة الظهور والتمييز</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked={product.isActive} className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">فعال (يظهر في المتجر)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">منتج مميز (يظهر في الصفحة الرئيسية)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="bestseller" defaultChecked={product.bestseller} className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">الأكثر مبيعاً</span>
                </label>
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
          )}
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/admin/products" className="btn btn-outline">
            إلغاء
          </Link>
          <button type="submit" className="btn btn-primary btn-lg">
            حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  )
}
