'use client'

import { useToast } from '@/components/ToastProvider'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Plus, Loader2, Camera, RefreshCw, Crop, Trash2 } from 'lucide-react'
import { compressImageClientSide } from '@/lib/compress'
import ImageEditorModal from './ImageEditorModal'

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

  // Image Editor Modal state
  const [editorState, setEditorState] = useState<{
    isOpen: boolean
    type: 'main' | 'extra'
    extraIndex?: number
    imageUrl: string
  }>({
    isOpen: false,
    type: 'main',
    imageUrl: '',
  })

  const uploadFile = async (file: File): Promise<string> => {
    let compressedFile = file
    try {
      compressedFile = await compressImageClientSide(file)
    } catch (e) {
      console.warn('Compression fallback to original file:', e)
    }

    const validFile = (compressedFile && compressedFile.size > 0) ? compressedFile : file
    const form = new FormData()
    form.append('file', validFile)
    const res = await fetch('/api/upload', { 
      method: 'POST', 
      body: form,
      credentials: 'include' 
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
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

  const handleOpenEditor = (type: 'main' | 'extra', extraIndex?: number) => {
    const targetUrl = type === 'main' ? mainImage : (additionalImages[extraIndex || 0] || '')
    if (!targetUrl) return
    setEditorState({
      isOpen: true,
      type,
      extraIndex,
      imageUrl: targetUrl,
    })
  }

  const handleSaveEditor = async (newBlobUrl: string, newFile: File) => {
    const { type, extraIndex } = editorState
    showToast('info', 'جاري حفظ الصورة المعدلة...')
    try {
      const uploadedUrl = await uploadFile(newFile)
      if (type === 'main') {
        onMainImageChange(uploadedUrl)
        showToast('success', 'تم تعديل وحفظ الصورة الرئيسية بنجاح!')
      } else if (type === 'extra' && typeof extraIndex === 'number' && onAdditionalImagesChange) {
        const copy = [...additionalImages]
        copy[extraIndex] = uploadedUrl
        onAdditionalImagesChange(copy)
        showToast('success', 'تم تعديل وحفظ الصورة الإضافية بنجاح!')
      }
    } catch (err: any) {
      showToast('error', err?.message || 'فشل حفظ الصورة المعدلة')
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Image Stage */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Stage Container */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 bg-gray-50 rounded-2xl border border-black/10 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group">
          {mainImage ? (
            <>
              <Image 
                src={mainImage} 
                alt="الصورة الرئيسية" 
                fill 
                className="object-contain p-2" 
                unoptimized
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none z-10">
                الصورة الأساسية
              </div>

              {/* Action Buttons on Main Image */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  disabled={uploadingMain}
                  className="flex-1 bg-white/90 hover:bg-white text-gray-900 px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95 border border-black/10"
                  title="استبدال هذه الصورة بصورة أخرى جديدة"
                >
                  <RefreshCw className="w-3 h-3 text-amber-600" />
                  <span>استبدال</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditor('main')}
                  disabled={uploadingMain}
                  className="flex-1 bg-black/85 hover:bg-black text-white px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95"
                  title="قص وتعديل وطمس الأسعار بالإصبع"
                >
                  <Crop className="w-3 h-3 text-amber-400" />
                  <span>تعديل</span>
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onMainImageChange('')}
                className="absolute top-2 left-2 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow-md z-10 transition-colors"
                title="حذف الصورة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div 
              onClick={() => mainInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
            >
              {uploadingMain ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-gray-700">جاري المعالجة والرفع...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-gray-800">اختر الصورة الأساسية</p>
                  <p className="text-[10px] text-gray-400 mt-1">أو التقط بالكاميرا</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Side Actions & Additional Images Section */}
        <div className="flex-1 space-y-3 w-full">
          {/* Quick upload buttons for Main Image */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mainInputRef.current?.click()}
              disabled={uploadingMain}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>{mainImage ? 'تغيير الصورة' : 'اختيار من الاستوديو'}</span>
            </button>
            <button
              type="button"
              onClick={() => mainCameraRef.current?.click()}
              disabled={uploadingMain}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>فتح الكاميرا</span>
            </button>
          </div>

          {!singleOnly && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  صور إضافية للمنتج (زوايا، تفاصيل، ألوان):
                </span>
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {additionalImages.length} من 10
                </span>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {additionalImages.map((extraImg, imgIdx) => (
                  <div key={imgIdx} className="relative w-16 h-16 rounded-xl border border-black/10 overflow-hidden bg-gray-50 group shrink-0">
                    <Image src={extraImg} alt="" fill className="object-contain p-1" unoptimized />
                    
                    {/* Hover Overlay with Edit & Delete */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => handleOpenEditor('extra', imgIdx)}
                        className="p-1 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg transition-colors"
                        title="تعديل وقص وطمس"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExtraImage(imgIdx)}
                        className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {additionalImages.length < 10 && (
                  <button
                    type="button"
                    onClick={() => extraInputRef.current?.click()}
                    disabled={uploadingExtra}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors shrink-0"
                    title="إضافة صور إضافية"
                  >
                    {uploadingExtra ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-0.5">إضافة</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={mainInputRef}
        onChange={handleMainUpload}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={mainCameraRef}
        onChange={handleMainUpload}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
      <input
        type="file"
        ref={extraInputRef}
        onChange={handleExtraUpload}
        className="hidden"
        accept="image/*"
        multiple
      />
      <input
        type="file"
        ref={extraCameraRef}
        onChange={handleExtraUpload}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      {/* Integrated Image Editor Modal */}
      {editorState.isOpen && (
        <ImageEditorModal
          isOpen={editorState.isOpen}
          imageUrl={editorState.imageUrl}
          onClose={() => setEditorState(prev => ({ ...prev, isOpen: false }))}
          onSave={handleSaveEditor}
        />
      )}
    </div>
  )
}
