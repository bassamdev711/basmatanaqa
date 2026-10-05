'use client'

import { startTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { Info, ImageIcon, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { createProduct } from '../actions'
import { getCollections } from '../../collections/actions'
import ImageUpload from '../ImageUpload'
import SeoOptimization from '@/components/admin/seo/SeoOptimization'
import { calculateSeoScore, SeoEvaluationData } from '@/lib/seo/score'

type CollectionOption = { id: string; name: string }

export default function NewProductPage() {
  const [mainImage, setMainImage] = useState('')
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [slug, setSlug] = useState('')
  const [sku, setSku] = useState('')
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [seoPhrases, setSeoPhrases] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  useEffect(() => {
    startTransition(() => {
      void getCollections().then(data => setCollections(data))
      // Auto-generate initial SKU
      generateSKU()
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">إضافة منتج جديد</h2>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">العودة</Link>
      </div>

      <form action={createProduct} className="space-y-6">
        {/* Hidden image fields */}
        <input type="hidden" name="imageUrl" value={mainImage} />
        <input type="hidden" name="images" value={JSON.stringify(extraImages)} />
        <input type="hidden" name="seoSearchPhrases" value={JSON.stringify(seoPhrases)} />
        <input type="hidden" name="seoScore" value={seoScore} />

        {/* --- الأقسام الأساسية المرئية دائماً --- */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
              <input type="text" name="name" required onChange={(e) => {
                setName(e.target.value)
                setSlug(generateSlug(e.target.value))
              }}
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
              <input type="number" name="price" step="0.01" min="0" required dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتوفرة</label>
              <input type="number" name="stock" min="0" defaultValue={10} dir="ltr"
                className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              <p className="text-xs text-gray-500 mt-1">القيمة الافتراضية 10 لتسريع الإضافة</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة (Collection)</label>
              <select name="collectionId" className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                <option value="">بدون مجموعة</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
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

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-bold text-gray-700 mb-3">حالة الظهور والتمييز</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">فعال (يظهر في المتجر)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="featured" className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">منتج مميز (يظهر في الصفحة الرئيسية)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="bestseller" className="h-4 w-4 rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">الأكثر مبيعاً</span>
                </label>
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
          )}
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/admin/products" className="btn btn-outline">
            إلغاء
          </Link>
          <button type="submit" className="btn btn-primary btn-lg">
            حفظ وإضافة المنتج
          </button>
        </div>
      </form>
    </div>
  )
}
