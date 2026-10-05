'use client'

import { useToast } from '@/components/ToastProvider'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react'
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
  const extraInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string> => {
    // ضغط الصورة
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploadingMain(false)
    }
  }

  const handleExtraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (additionalImages.length + files.length > 5) {
      showToast('success', 'الحد الأقصى للصور الإضافية هو 5 صور')
      return
    }
    setUploadingExtra(true)
    try {
      const urls = await Promise.all(files.map(uploadFile))
      if (onAdditionalImagesChange) onAdditionalImagesChange([...additionalImages, ...urls])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploadingExtra(false)
    }
  }

  const removeExtraImage = (index: number) => {
    if (onAdditionalImagesChange) onAdditionalImagesChange(additionalImages.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">الصورة الرئيسية</label>
        <div
          onClick={() => mainInputRef.current?.click()}
          className="relative w-full h-56 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-black transition-colors bg-gray-50 flex items-center justify-center"
        >
          {mainImage ? (
            <Image src={mainImage} alt="الصورة الرئيسية" fill className="object-cover" />
          ) : (
            <div className="text-center text-gray-400">
              {uploadingMain ? (
                <Loader2 className="w-10 h-10 mx-auto animate-spin mb-2" />
              ) : (
                <Upload className="w-10 h-10 mx-auto mb-2" />
              )}
              <p className="text-sm">{uploadingMain ? 'جارٍ الرفع...' : 'انقر لرفع الصورة الرئيسية'}</p>
              <p className="text-xs mt-1">JPG, PNG, WebP — أقل من 5MB</p>
            </div>
          )}
          {mainImage && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMainImageChange('') }}
              className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {mainImage && (
            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">
              انقر لتغيير الصورة
            </div>
          )}
        </div>
        <input type="file" ref={mainInputRef} onChange={handleMainUpload} className="hidden" accept="image/*" />
      </div>

      {/* Additional Images */}
      {!singleOnly && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            صور إضافية ({additionalImages.length}/5)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
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
            {additionalImages.length < 5 && (
              <button
                type="button"
                onClick={() => extraInputRef.current?.click()}
                className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"
              >
                {uploadingExtra ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ImagePlus className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
          <input type="file" ref={extraInputRef} onChange={handleExtraUpload} className="hidden" accept="image/*" multiple />
        </div>
      )}
    </div>
  )
}
