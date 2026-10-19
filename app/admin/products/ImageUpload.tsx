'use client'

import { useToast } from '@/components/ToastProvider'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImagePlus, Loader2, Camera } from 'lucide-react'
import { compressImageClientSide } from '@/lib/compress'

interface ImageUploadProps {
  mainImage: string
  additionalImages?: string[]
  onMainImageChange: (url: string) => void
  onAdditionalImagesChange?: (urls: string[]) => void
  singleOnly?: boolean
}

export default function ImageUpload({
  mainImage,
  additionalImages = [],
  onMainImageChange,
  onAdditionalImagesChange,
  singleOnly = false,
}: ImageUploadProps) {
  const { showToast } = useToast()
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const mainInputRef = useRef<HTMLInputElement>(null)
  const mainCameraRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)
  const extraCameraRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string> => {
    // ضغط الصورة تلقائياً وتحويلها لـ webp عالية الجودة وخفيفة الحجم
    const compressedFile = await compressImageClientSide(file)
    
    const form = new FormData()
    form.append('file', compressedFile)
    const res = await fetch('/api/upload', { 
      method: 'POST', 
      body: form,
      credentials: 'include' 
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'فشل رفع الصورة')
    }
    const { url } = await res.json()
    return url
  }

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMain(true)
    try {
      const url = await uploadFile(file)
      onMainImageChange(url)
      showToast('success', 'تم رفع وضغط الصورة بنجاح!')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploadingMain(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleExtraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (additionalImages.length + files.length > 10) {
      showToast('error', 'الحد الأقصى للصور الإضافية هو 10 صور')
      return
    }
    setUploadingExtra(true)
    try {
      const urls = await Promise.all(files.map(uploadFile))
      if (onAdditionalImagesChange) onAdditionalImagesChange([...additionalImages, ...urls])
      showToast('success', 'تم رفع الصور وضغطها بنجاح!')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'فشل رفع الصور')
    } finally {
      setUploadingExtra(false)
      if (e.target) e.target.value = ''
    }
  }

  const removeExtraImage = (index: number) => {
    if (onAdditionalImagesChange) onAdditionalImagesChange(additionalImages.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">الصورة الرئيسية</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mainCameraRef.current?.click()}
              disabled={uploadingMain}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="التقاط صورة مباشرة بالكاميرا"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>فتح الكاميرا</span>
            </button>
            <button
              type="button"
              onClick={() => mainInputRef.current?.click()}
              disabled={uploadingMain}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              title="اختيار من المعرض أو الملفات"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>اختيار ملف</span>
            </button>
          </div>
        </div>

        <div
          onClick={() => mainInputRef.current?.click()}
          className="relative w-full h-56 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-black transition-colors bg-gray-50 flex items-center justify-center"
        >
          {mainImage ? (
            <Image src={mainImage} alt="الصورة الرئيسية" fill className="object-cover" />
          ) : (
            <div className="text-center text-gray-400 p-4">
              {uploadingMain ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto animate-spin mb-2 text-emerald-600" />
                  <p className="text-sm font-bold text-gray-700">جارٍ معالجة وضغط ورفع الصورة...</p>
                  <p className="text-xs text-gray-400 mt-1">يتم تقليص حجم الصورة تلقائياً لتسريع المتجر</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">انقر لاختيار صورة أو استخدم زر الكاميرا بالأعلى</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — يتم ضغط صور الكاميرا تلقائياً</p>
                </>
              )}
            </div>
          )}
          {mainImage && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMainImageChange('') }}
              className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 z-10 shadow"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {mainImage && (
            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1.5 text-center">
              انقر لتغيير الصورة
            </div>
          )}
        </div>

        {/* Regular file picker */}
        <input
          type="file"
          ref={mainInputRef}
          onChange={handleMainUpload}
          className="hidden"
          accept="image/*"
        />

        {/* Direct Camera capture input */}
        <input
          type="file"
          ref={mainCameraRef}
          onChange={handleMainUpload}
          className="hidden"
          accept="image/*"
          capture="environment"
        />
      </div>

      {/* Additional Images */}
      {!singleOnly && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              صور إضافية ({additionalImages.length}/10)
            </label>
            {additionalImages.length < 10 && (
              <button
                type="button"
                onClick={() => extraCameraRef.current?.click()}
                disabled={uploadingExtra}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="تصوير بالكاميرا"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>تصوير إضافي</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {additionalImages.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-gray-200">
                <Image src={url} alt={`صورة ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExtraImage(i)}
                  className="absolute top-1 left-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {additionalImages.length < 10 && (
              <button
                type="button"
                onClick={() => extraInputRef.current?.click()}
                disabled={uploadingExtra}
                className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"
              >
                {uploadingExtra ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                ) : (
                  <ImagePlus className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          {/* Regular multi-file picker */}
          <input
            type="file"
            ref={extraInputRef}
            onChange={handleExtraUpload}
            className="hidden"
            accept="image/*"
            multiple
          />

          {/* Camera capture for additional image */}
          <input
            type="file"
            ref={extraCameraRef}
            onChange={handleExtraUpload}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
        </div>
      )}
    </div>
  )
}
