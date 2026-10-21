'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Images, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Layers, 
  Upload, 
  ArrowRight,
  Sparkles,
  Camera,
  Crop,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useProductQueue } from '../ProductQueueContext'
import { getCollections, getSubCategories } from '../../collections/actions'
import { getSuppliers } from '../../suppliers/actions'
import SizeSelector from '../SizeSelector'
import ImageEditorModal from '../ImageEditorModal'
import { toast } from 'react-hot-toast'
import { compressImageClientSide } from '@/lib/compress'

type SupplierItem = {
  id: string
  name: string
}

type CollectionItem = {
  id: string
  name: string
}

type SubCategoryItem = {
  id: string
  name: string
  collectionId: string
}

type BulkProductCard = {
  id: string
  mainImageBlobUrl: string
  mainImageFile?: File
  extraImagesBlobUrls: string[]
  extraImageFiles?: File[]
  name: string
  price: string
  stock: string
  costPrice: string
  collectionId: string
  subCategoryIds: string[]
  supplierId?: string
  hasSizes: boolean
  availableSizes: string[]
  description: string
  isSubmitted: boolean
}

export default function BulkUploadClient() {
  const { addToQueue } = useProductQueue()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const extraImgInputRef = useRef<HTMLInputElement>(null)
  const replaceMainInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, SubCategoryItem[]>>({})
  const [defaultCollectionId, setDefaultCollectionId] = useState('')
  const [products, setProducts] = useState<BulkProductCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showStockSupplier, setShowStockSupplier] = useState(false)
  
  // Safe delete confirmation modal state
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null)

  // Image Editor Modal state
  const [editingImage, setEditingImage] = useState<{
    isOpen: boolean
    type: 'main' | 'extra'
    cardIndex: number
    extraIndex?: number
    imageUrl: string
  }>({
    isOpen: false,
    type: 'main',
    cardIndex: 0,
    imageUrl: '',
  })

  // Handle replacing the main image of a card with a new chosen photo
  const handleReplaceMainImage = (files: FileList | null) => {
    if (!files || files.length === 0 || !products[currentIndex]) return
    const file = files[0]
    try {
      const blobUrl = URL.createObjectURL(file)
      updateCard(currentIndex, {
        mainImageBlobUrl: blobUrl,
        mainImageFile: file,
      })
      toast.success('تم استبدال الصورة بنجاح!')
    } catch {
      toast.error('فشل استبدال الصورة')
    } finally {
      if (replaceMainInputRef.current) {
        replaceMainInputRef.current.value = ''
      }
    }
  }

  const handleOpenEditor = (type: 'main' | 'extra', cardIndex: number, extraIndex?: number) => {
    const card = products[cardIndex]
    if (!card) return
    const targetUrl = type === 'main' ? card.mainImageBlobUrl : (card.extraImagesBlobUrls[extraIndex || 0] || '')
    if (!targetUrl) return
    setEditingImage({
      isOpen: true,
      type,
      cardIndex,
      extraIndex,
      imageUrl: targetUrl,
    })
  }

  const handleSaveEditor = (newBlobUrl: string, newFile: File) => {
    const { type, cardIndex, extraIndex } = editingImage
    const card = products[cardIndex]
    if (!card) return

    if (type === 'main') {
      updateCard(cardIndex, {
        mainImageBlobUrl: newBlobUrl,
        mainImageFile: newFile,
      })
      toast.success('تم تحديث الصورة الرئيسية')
    } else if (type === 'extra' && typeof extraIndex === 'number') {
      const copyBlobUrls = [...card.extraImagesBlobUrls]
      const copyFiles = [...(card.extraImageFiles || [])]
      copyBlobUrls[extraIndex] = newBlobUrl
      copyFiles[extraIndex] = newFile
      updateCard(cardIndex, {
        extraImagesBlobUrls: copyBlobUrls,
        extraImageFiles: copyFiles,
      })
      toast.success('تم تحديث الصورة الإضافية')
    }
  }

  // Auto focus name input on current card change (both desktop and mobile)
  useEffect(() => {
    if (products.length > 0 && products[currentIndex]) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, products.length])

  // Fetch collections and their subcategories on mount
  useEffect(() => {
    getCollections().then(async (cols) => {
      if (Array.isArray(cols)) {
        const formatted = cols.map(c => ({ id: c.id, name: c.name }))
        setCollections(formatted)
        
        // Find "الملابس" or default to first
        const clothesCol = formatted.find(c => c.name.includes('ملابس')) || formatted[0]
        if (clothesCol) {
          setDefaultCollectionId(clothesCol.id)
          // Load subcategories for this collection
          const subCats = await getSubCategories(clothesCol.id)
          if (Array.isArray(subCats)) {
            setSubCategoriesMap(prev => ({
              ...prev,
              [clothesCol.id]: subCats.map(sc => ({ id: sc.id, name: sc.name, collectionId: clothesCol.id }))
            }))
          }
        }
      }
    }).catch(console.error)

    getSuppliers().then(data => {
      if (Array.isArray(data)) {
        setSuppliers(data.filter(s => s.isActive).map(s => ({ id: s.id, name: s.name })))
      }
    }).catch(console.error)
  }, [])

  // When collection changes for an item, lazy load its subcategories if not cached
  const handleCollectionChange = async (cardIndex: number, colId: string) => {
    updateCard(cardIndex, { collectionId: colId, subCategoryIds: [] })
    if (colId && !subCategoriesMap[colId]) {
      try {
        const subCats = await getSubCategories(colId)
        if (Array.isArray(subCats)) {
          setSubCategoriesMap(prev => ({
            ...prev,
            [colId]: subCats.map(sc => ({ id: sc.id, name: sc.name, collectionId: colId }))
          }))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Handle Bulk Image Selection
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const newCards: BulkProductCard[] = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      try {
        const blobUrl = URL.createObjectURL(file)

        newCards.push({
          id: `bulk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          mainImageBlobUrl: blobUrl,
          mainImageFile: file,
          extraImagesBlobUrls: [],
          extraImageFiles: [],
          name: '',
          price: '',
          stock: '10',
          costPrice: '',
          collectionId: defaultCollectionId,
          subCategoryIds: [],
          hasSizes: false,
          availableSizes: [],
          description: '',
          isSubmitted: false,
        })
      } catch (err) {
        console.error('Failed to process image file:', err)
      }
    }

    if (newCards.length > 0) {
      setProducts(prev => {
        const updated = [...prev, ...newCards]
        // If first batch, set current index to 0
        if (prev.length === 0) setCurrentIndex(0)
        return updated
      })
      toast.success(`تم فتح ${newCards.length} منتج بنجاح وبكامل جودة الصور!`)
    }

    // Reset file input so selecting files again will trigger onChange reliably
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateCard = (index: number, updates: Partial<BulkProductCard>) => {
    setProducts(prev => {
      const copy = [...prev]
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updates }
      }
      return copy
    })
  }

  const toggleSubCategory = (cardIndex: number, subCatId: string) => {
    const card = products[cardIndex]
    if (!card) return
    const exists = card.subCategoryIds.includes(subCatId)
    const updated = exists 
      ? card.subCategoryIds.filter(id => id !== subCatId)
      : [...card.subCategoryIds, subCatId]
    updateCard(cardIndex, { subCategoryIds: updated })
  }

  // Add extra images to current card with multiple support and auto-reset
  const handleAddExtraImage = (files: FileList | null) => {
    if (!files || files.length === 0 || !products[currentIndex]) return
    const fileArray = Array.from(files)
    
    // Reset file input value immediately so selecting the same file later works reliably
    if (extraImgInputRef.current) {
      extraImgInputRef.current.value = ''
    }

    const currentExtras = products[currentIndex].extraImagesBlobUrls || []
    const currentExtraFiles = products[currentIndex].extraImageFiles || []
    const availableSlots = 10 - currentExtras.length

    if (availableSlots <= 0) {
      toast.error('الحد الأقصى هو 10 صور إضافية للمنتج')
      return
    }

    const filesToProcess = fileArray.slice(0, availableSlots)
    const newBlobUrls: string[] = []
    const newFiles: File[] = []

    for (const file of filesToProcess) {
      try {
        const blobUrl = URL.createObjectURL(file)
        newBlobUrls.push(blobUrl)
        newFiles.push(file)
      } catch (err) {
        console.error('Error reading extra image:', err)
      }
    }

    updateCard(currentIndex, { 
      extraImagesBlobUrls: [...currentExtras, ...newBlobUrls],
      extraImageFiles: [...currentExtraFiles, ...newFiles],
    })

    toast.success(newFiles.length > 1 ? `تمت إضافة ${newFiles.length} صور إضافية بنجاح` : 'تمت إضافة الصورة الإضافية بنجاح')
  }

  const removeExtraImage = (cardIndex: number, imgIndex: number) => {
    const card = products[cardIndex]
    if (!card) return
    const updated = card.extraImagesBlobUrls.filter((_, i) => i !== imgIndex)
    const updatedFiles = (card.extraImageFiles || []).filter((_, i) => i !== imgIndex)
    updateCard(cardIndex, { extraImagesBlobUrls: updated, extraImageFiles: updatedFiles })
  }

  const removeCard = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
    if (currentIndex >= products.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Submit single card to the fast background queue and auto-slide
  const handleSubmitCard = (cardIndex: number) => {
    const card = products[cardIndex]
    if (!card) return

    // Prevent duplicate submission if already queued
    if (card.isSubmitted) {
      toast('هذا المنتج تمت إضافته بالفعل إلى طابور الحفظ مسبقاً', { icon: 'ℹ️' })
      // If there are other unsubmitted items, advance to them
      const nextUnsubmittedIndex = products.findIndex((p, idx) => idx > cardIndex && !p.isSubmitted)
      if (nextUnsubmittedIndex !== -1) {
        setCurrentIndex(nextUnsubmittedIndex)
      } else {
        const anyUnsubmittedIndex = products.findIndex(p => !p.isSubmitted)
        if (anyUnsubmittedIndex !== -1) {
          setCurrentIndex(anyUnsubmittedIndex)
        }
      }
      return
    }

    if (!card.name.trim()) {
      toast.error('يرجى إدخال اسم المنتج')
      nameInputRef.current?.focus()
      return
    }
    const numPrice = Number(card.price)
    if (!card.price || isNaN(numPrice) || numPrice < 0) {
      toast.error('يرجى إدخال سعر صحيح للمنتج')
      return
    }

    // Add to persistent background queue
    addToQueue({
      name: card.name.trim(),
      price: numPrice,
      stock: card.stock ? Number(card.stock) : 10,
      costPrice: card.costPrice ? Number(card.costPrice) : null,
      collectionId: card.collectionId || null,
      subCategoryId: card.subCategoryIds[0] || null,
      subCategoryIds: card.subCategoryIds,
      supplierId: card.supplierId || null,
      description: card.description || null,
      mainImageFile: card.mainImageFile,
      mainImageFileUrl: card.mainImageBlobUrl,
      extraImageFiles: card.extraImageFiles && card.extraImageFiles.length > 0 ? card.extraImageFiles : undefined,
      extraImageFileUrls: card.extraImagesBlobUrls.length > 0 ? card.extraImagesBlobUrls : undefined,
      hasSizes: card.hasSizes,
      availableSizes: card.availableSizes,
    })

    // Mark as submitted
    updateCard(cardIndex, { isSubmitted: true })
    toast.success(`تمت إضافة "${card.name}" إلى طابور المعالجة بالخلفية 🚀`)

    // Check if there are remaining unsubmitted cards in the batch
    const nextUnsubmittedIndex = products.findIndex((p, idx) => idx > cardIndex && !p.isSubmitted)
    if (nextUnsubmittedIndex !== -1) {
      setCurrentIndex(nextUnsubmittedIndex)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    } else {
      // Look from the start
      const anyUnsubmittedIndex = products.findIndex((p, idx) => idx !== cardIndex && !p.isSubmitted)
      if (anyUnsubmittedIndex !== -1) {
        setCurrentIndex(anyUnsubmittedIndex)
        window.scrollTo({ top: 120, behavior: 'smooth' })
      } else {
        // All cards in current batch are completed
        toast.success(`اكتملت جميع المنتجات (${products.length} من ${products.length}) بنجاح! يمكنك إضافة دفعة أخرى متى شئت. ✨`, { duration: 6000 })
      }
    }
  }

  const currentCard = products[currentIndex]
  const currentSubCats = currentCard ? (subCategoriesMap[currentCard.collectionId] || []) : []
  const completedCount = products.filter(p => p.isSubmitted).length
  const allCompleted = products.length > 0 && completedCount === products.length

  const handleStartNewBatch = () => {
    setProducts([])
    setCurrentIndex(0)
    fileInputRef.current?.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs mb-1">
            <Layers className="w-4 h-4 text-brand" />
            <span>نظام الإدخال المتعدد</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">إضافة متعددة للمنتجات</h1>
          <p className="text-xs text-gray-500 mt-1">
            تحديد صور المنتجات دفعة واحدة مع نماذج إدخال متسلسلة وسريعة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/admin/products"
            className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
          >
            العودة للمنتجات
          </Link>
        </div>
      </div>

      {/* Upload Zone / Action Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-right">
          <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2">
            <Images className="w-5 h-5 text-amber-400" />
            <span>اختر صور المنتجات دفعة واحدة</span>
          </h3>
          <p className="text-xs text-gray-300">
            يمكنك تحديد 10 أو 20 أو أي عدد من الصور من هاتفك أو جهازك دفعة واحدة
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Multiple File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            multiple 
            accept="image/*"
            className="hidden" 
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>فتح الاستوديو واختيار الصور</span>
          </button>
        </div>
      </div>

      {/* Progress & Navigation Bar (If items exist) */}
      {products.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>النماذج المنشأة: {products.length}</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                تمت إضافة: {completedCount} من {products.length}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span>النموذج الحالي: </span>
              <span className="text-black font-black text-sm">#{currentIndex + 1}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(completedCount / products.length) * 100}%` }}
            />
          </div>

          {/* Horizontal Thumbnails Carousel for Quick Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {products.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all flex items-center justify-center ${
                  currentIndex === idx 
                    ? 'border-black ring-2 ring-black/20 scale-105' 
                    : p.isSubmitted 
                      ? 'border-emerald-500 opacity-60' 
                      : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img 
                  src={p.mainImageBlobUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
                {p.isSubmitted && (
                  <div className="absolute inset-0 bg-emerald-600/60 backdrop-blur-[1px] flex items-center justify-center">
                    <Check className="w-5 h-5 text-white stroke-[3]" />
                  </div>
                )}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-white bg-black/60 px-1 rounded">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Product Form Card */}
      {currentCard && (
        <div className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
          currentCard.isSubmitted ? 'border-emerald-300 bg-emerald-50/10' : 'border-black/10'
        }`}>
          
          {/* Top Form Status Bar */}
          <div className="flex items-center justify-between p-4 border-b border-black/5 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-black text-gray-900 text-sm">
                المنتج رقم #{currentIndex + 1} من أصل {products.length}
              </span>
              {currentCard.isSubmitted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3.5 h-3.5" /> تمت الإضافة للطابور
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteIndex(currentIndex)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-200/60"
                title="حذف هذا النموذج وعدم إضافته"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف النموذج</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* 1. الصورة في أول حقل دائماً بوضوح تام */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-gray-900">
                صورة المنتج الأساسية والصور الإضافية *
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Main Image Stage */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 bg-gray-50 rounded-2xl border border-black/10 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group">
                  <img 
                    src={currentCard.mainImageBlobUrl} 
                    alt="الصورة الرئيسية"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                    الصورة الأساسية
                  </div>

                  {/* Hidden file input for replacing main image */}
                  <input
                    type="file"
                    ref={replaceMainInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleReplaceMainImage(e.target.files)}
                  />

                  {/* Action Buttons on Main Image */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1.5">
                    {/* Replace Image Button */}
                    <button
                      type="button"
                      onClick={() => replaceMainInputRef.current?.click()}
                      className="flex-1 bg-white/90 hover:bg-white text-gray-900 px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95 border border-black/10"
                      title="استبدال هذه الصورة بصورة أخرى جديدة من الاستوديو"
                    >
                      <RefreshCw className="w-3 h-3 text-brand" />
                      <span>استبدال</span>
                    </button>

                    {/* Edit / Crop / Blur Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditor('main', currentIndex)}
                      className="flex-1 bg-black/85 hover:bg-black text-white px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95"
                      title="قص وتعديل وطمس الأسعار بالإصبع"
                    >
                      <Crop className="w-3 h-3 text-amber-400" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>

                {/* Additional Images Section */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">
                      صور إضافية لنفس المنتج:
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {currentCard.extraImagesBlobUrls.length} من 10
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {currentCard.extraImagesBlobUrls.map((extraImg, imgIdx) => (
                      <div 
                        key={imgIdx} 
                        className="relative w-full aspect-square bg-gray-50 rounded-2xl border border-black/10 overflow-hidden shadow-sm group flex items-center justify-center"
                      >
                        <img 
                          src={extraImg} 
                          alt={`صورة إضافية ${imgIdx + 1}`} 
                          className="w-full h-full object-contain p-2" 
                        />
                        
                        {/* Badge */}
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none z-10">
                          صورة {imgIdx + 1}
                        </div>

                        {/* Delete button (Top Left) */}
                        <button
                          type="button"
                          onClick={() => removeExtraImage(currentIndex, imgIdx)}
                          className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-lg z-20 transition-all flex items-center gap-1 active:scale-90"
                          title="إزالة هذه الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold px-0.5">حذف</span>
                        </button>

                        {/* Action Buttons on Image Bottom (Replace & Edit) */}
                        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              input.onchange = async (e: any) => {
                                const file = e.target?.files?.[0]
                                if (!file) return
                                try {
                                  let compressed = file
                                  try {
                                    compressed = await compressImageClientSide(file)
                                  } catch (compErr) {
                                    console.warn('Compression error:', compErr)
                                  }
                                  const validFile = (compressed && compressed.size > 0) ? compressed : file
                                  const newBlobUrl = URL.createObjectURL(validFile)
                                  const copyBlobUrls = [...currentCard.extraImagesBlobUrls]
                                  const copyFiles = [...(currentCard.extraImageFiles || [])]
                                  copyBlobUrls[imgIdx] = newBlobUrl
                                  copyFiles[imgIdx] = validFile
                                  updateCard(currentIndex, {
                                    extraImagesBlobUrls: copyBlobUrls,
                                    extraImageFiles: copyFiles,
                                  })
                                  toast.success('تم استبدال الصورة الإضافية بنجاح')
                                } catch (err: any) {
                                  toast.error('فشل استبدال الصورة الإضافية')
                                }
                              }
                              input.click()
                            }}
                            className="flex-1 bg-white/95 hover:bg-white text-gray-900 px-1.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95 border border-black/10"
                            title="استبدال هذه الصورة"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-600" />
                            <span>استبدال</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditor('extra', currentIndex, imgIdx)}
                            className="flex-1 bg-black/85 hover:bg-black text-white px-1.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md backdrop-blur-sm transition-all active:scale-95"
                            title="تعديل وقص الصورة"
                          >
                            <Crop className="w-3 h-3 text-amber-400" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {currentCard.extraImagesBlobUrls.length < 10 && (
                      <>
                        <input 
                          type="file" 
                          ref={extraImgInputRef}
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAddExtraImage(e.target.files)}
                        />
                        <button
                          type="button"
                          onClick={() => extraImgInputRef.current?.click()}
                          className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center text-gray-400 hover:text-black transition-all bg-gray-50/50 hover:bg-gray-50 active:scale-95 min-h-[140px]"
                          title="إضافة صور إضافية"
                        >
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-1.5">
                            <Plus className="w-5 h-5 text-gray-700" />
                          </div>
                          <span className="text-xs font-bold text-gray-700">إضافة صورة</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">أو أكثر من ألبومك</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. اسم المنتج والسعر والكمية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-black/5">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-800 mb-1">اسم المنتج *</label>
                <input 
                  ref={nameInputRef}
                  type="text"
                  placeholder="مثال: فستان بناتي أنيق مورد"
                  value={currentCard.name}
                  onChange={(e) => updateCard(currentIndex, { name: e.target.value })}
                  className="w-full rounded-xl border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                
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
                        const current = currentCard.name.trim()
                        const updated = current ? `${current} ${word}` : word
                        updateCard(currentIndex, { name: updated })
                        nameInputRef.current?.focus()
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 active:bg-amber-100 text-gray-800 border border-gray-200 transition-all hover:scale-105 select-none"
                    >
                      + {word}
                    </button>
                  ))}
                  {currentCard.name && (
                    <button
                      type="button"
                      onClick={() => {
                        updateCard(currentIndex, { name: '' })
                        nameInputRef.current?.focus()
                      }}
                      className="text-[11px] text-red-500 hover:underline px-1.5 font-bold mr-auto"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">السعر (ر.ي) *</label>
                <input 
                  type="number"
                  placeholder="مثال: 2500"
                  value={currentCard.price}
                  onChange={(e) => updateCard(currentIndex, { price: e.target.value })}
                  step="0.01"
                  min="0"
                  dir="ltr"
                  className="w-full rounded-xl border-gray-300 border p-3 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                {/* أزرار مساعدة سريعة للأسعار الشائعة */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['1000', '2000', '2200', '2500', '2700', '3000', '3200', '4000'].map((presetPrice) => (
                    <button
                      key={presetPrice}
                      type="button"
                      onClick={() => updateCard(currentIndex, { price: presetPrice })}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all border ${
                        currentCard.price === presetPrice
                          ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {presetPrice}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. المجموعة والمجموعات الفرعية (افتراضياً: الملابس) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-800 mb-1">
                  المجموعة الرئيسية (افتراضياً: الملابس)
                </label>
                <select
                  value={currentCard.collectionId}
                  onChange={(e) => handleCollectionChange(currentIndex, e.target.value)}
                  className="w-full rounded-xl border-gray-300 border p-3 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">بدون مجموعة</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* زر القائمة المنسدلة لإظهار/إخفاء الكمية المتوفرة والمورد معاً في نفس السطر على الهاتف */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowStockSupplier(!showStockSupplier)}
                  className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200"
                >
                  <span className="flex items-center gap-2">
                    <span>الكمية المتوفرة والمورد</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      (الكمية: {currentCard.stock || 10} {currentCard.supplierId ? `• المورد: ${suppliers.find(s => s.id === currentCard.supplierId)?.name || ''}` : ''})
                    </span>
                  </span>
                  {showStockSupplier ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {showStockSupplier && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">الكمية المتوفرة</label>
                      <input 
                        type="number" 
                        value={currentCard.stock} 
                        onChange={(e) => updateCard(currentIndex, { stock: e.target.value })} 
                        min="0" 
                        dir="ltr"
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
                      />
                      <p className="text-[10px] text-gray-500 mt-1">افتراضياً: 10</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">المورد</label>
                      <select 
                        value={currentCard.supplierId || ''} 
                        onChange={(e) => updateCard(currentIndex, { supplierId: e.target.value })} 
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="">بدون مورد</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-800 mb-1.5">
                  المجموعات الفرعية (انقر للاختيار - يمكن اختيار أكثر من فرع)
                </label>
                {currentSubCats.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                    لا توجد فروع فرعية مضافة لهذه المجموعة حتى الآن
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {currentSubCats.map(subCat => {
                      const isSelected = currentCard.subCategoryIds.includes(subCat.id)
                      return (
                        <button
                          key={subCat.id}
                          type="button"
                          onClick={() => toggleSubCategory(currentIndex, subCat.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{subCat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 4. المقاسات */}
            <div className="pt-2">
              <SizeSelector
                hasSizes={currentCard.hasSizes}
                onHasSizesChange={(val) => updateCard(currentIndex, { hasSizes: val })}
                availableSizes={currentCard.availableSizes}
                onChangeSizes={(sizes) => updateCard(currentIndex, { availableSizes: sizes })}
              />
            </div>

            {/* Action Buttons: الإضافة والانتقال الفوري للتالي */}
            <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="flex items-center justify-center gap-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex >= products.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center justify-center gap-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {currentCard.isSubmitted ? (
                  <>
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl">
                      <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                      <span>تمت إضافة هذا المنتج للطابور</span>
                    </div>

                    {products.some(p => !p.isSubmitted) && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = products.findIndex((p, idx) => idx > currentIndex && !p.isSubmitted)
                          if (nextIdx !== -1) {
                            setCurrentIndex(nextIdx)
                            window.scrollTo({ top: 120, behavior: 'smooth' })
                          } else {
                            const anyIdx = products.findIndex(p => !p.isSubmitted)
                            if (anyIdx !== -1) {
                              setCurrentIndex(anyIdx)
                              window.scrollTo({ top: 120, behavior: 'smooth' })
                            }
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 px-5 py-3 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                      >
                        <span>الانتقال للمنتج غير المكتمل</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة صور أخرى</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitCard(currentIndex)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-black hover:bg-gray-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>إضافة هذا المنتج والتمرير للتالي</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Completion Banner when all products in current batch are submitted */}
      {allCompleted && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                اكتملت إضافة جميع المنتجات ({completedCount} من {products.length})
              </h3>
              <p className="text-xs text-emerald-200 mt-1">
                جميع المنتجات موجودة الآن في طابور الحفظ بالخلفية وتُحفظ تباعاً في قاعدة البيانات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStartNewBatch}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow transition-all active:scale-95"
            >
              إضافة دفعة صور جديدة
            </button>
            <Link
              href="/admin/products"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all text-center"
            >
              عرض المنتجات
            </Link>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            انقر على زر &quot;فتح الاستوديو واختيار الصور&quot; بالأعلى واختر 20 أو 30 صورة معاً لتبدأ الإضافة بسرعة البرق!
          </p>
        </div>
      )}

      {/* Client-Side Image Editor Modal */}
      <ImageEditorModal
        isOpen={editingImage.isOpen}
        imageUrl={editingImage.imageUrl}
        onClose={() => setEditingImage(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveEditor}
      />

      {/* Safe Delete Confirmation Modal */}
      {confirmDeleteIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">
                هل أنت متأكد من حذف هذا النموذج؟
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                لن يتم رفع هذا المنتج إلى المتجر وسيتم استبعاده فوراً من قائمة الإضافة الحالية.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteIndex(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
              >
                تراجع
              </button>

              <button
                type="button"
                onClick={() => {
                  const idxToDelete = confirmDeleteIndex
                  setConfirmDeleteIndex(null)
                  removeCard(idxToDelete)
                  toast.success('تم حذف النموذج واستبعاده بأمان')
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
              >
                نعم، احذف النموذج
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
