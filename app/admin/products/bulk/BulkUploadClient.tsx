'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Images, 
  Plus, 
  Trash2, 
  Check, 
  Zap, 
  Upload, 
  ArrowRight,
  Camera,
  Crop,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  Edit3,
  Loader2,
  Sparkles,
  Wand2,
  Copy,
  CheckCheck
} from 'lucide-react'
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
  uploadedMainUrl?: string
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
  isSaved: boolean
  savedProductId?: string
  isSaving?: boolean
}

const NAME_SUGGESTIONS = [
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
]

const PRICE_PRESETS = [
  '500', '750', '1000', '1250', '1500', '1750', '2000', '2250',
  '2500', '2750', '3000', '3250', '3500', '3750', '4000', '4250',
  '4500', '4750', '5000'
]

export default function BulkUploadClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, SubCategoryItem[]>>({})
  const [defaultCollectionId, setDefaultCollectionId] = useState('')
  const [products, setProducts] = useState<BulkProductCard[]>([])
  const [showStockSupplier, setShowStockSupplier] = useState(false)
  const [autoPrefillFromPrevious, setAutoPrefillFromPrevious] = useState(true)

  // Magic Quick-Fill & Bulk Save Template state
  const [magicTemplate, setMagicTemplate] = useState<{
    name: string
    price: string
    collectionId: string
    subCategoryIds: string[]
    hasSizes: boolean
    availableSizes: string[]
    supplierId?: string
    stock?: string
  }>({
    name: '',
    price: '',
    collectionId: '',
    subCategoryIds: [],
    hasSizes: false,
    availableSizes: [],
    supplierId: '',
    stock: '10',
  })
  const [isMagicPanelOpen, setIsMagicPanelOpen] = useState(true)
  const [isBatchSaving, setIsBatchSaving] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentName?: string }>({
    current: 0,
    total: 0,
  })

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

  // Load collections and suppliers on mount
  useEffect(() => {
    getCollections().then(async (cols) => {
      if (Array.isArray(cols)) {
        const formatted = cols.map(c => ({ id: c.id, name: c.name }))
        setCollections(formatted)
        
        const clothesCol = formatted.find(c => c.name.includes('ملابس')) || formatted[0]
        if (clothesCol) {
          setDefaultCollectionId(clothesCol.id)
          setMagicTemplate(prev => ({ ...prev, collectionId: clothesCol.id }))
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

  // Handle files selected (either from gallery or camera)
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
          isSaved: false,
        })
      } catch (err) {
        console.error('Failed to process image file:', err)
      }
    }

    if (newCards.length > 0) {
      setProducts(prev => [...prev, ...newCards])
      toast.success(`تمت إضافة ${newCards.length} منتج إلى القائمة المتسلسلة!`)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
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

  const toggleSubCategory = (cardIndex: number, subCatId: string) => {
    const card = products[cardIndex]
    if (!card) return
    const exists = card.subCategoryIds.includes(subCatId)
    const updated = exists 
      ? card.subCategoryIds.filter(id => id !== subCatId)
      : [...card.subCategoryIds, subCatId]
    updateCard(cardIndex, { subCategoryIds: updated })
  }

  const handleDeleteCard = (cardIndex: number) => {
    setProducts(prev => prev.filter((_, idx) => idx !== cardIndex))
    setConfirmDeleteIndex(null)
    toast.success('تم حذف بطاقة المنتج من القائمة')
  }

  const handleReplaceMainImage = (cardIndex: number, files: FileList | null) => {
    if (!files || files.length === 0 || !products[cardIndex]) return
    const file = files[0]
    try {
      const blobUrl = URL.createObjectURL(file)
      updateCard(cardIndex, {
        mainImageBlobUrl: blobUrl,
        mainImageFile: file,
        uploadedMainUrl: undefined, // reset so it uploads new image
      })
      toast.success('تم استبدال الصورة بنجاح!')
    } catch {
      toast.error('فشل استبدال الصورة')
    }
  }

  const handleAddExtraImage = (cardIndex: number, files: FileList | null) => {
    if (!files || files.length === 0 || !products[cardIndex]) return
    const card = products[cardIndex]
    const fileArray = Array.from(files)
    const availableSlots = 10 - card.extraImagesBlobUrls.length
    if (availableSlots <= 0) {
      toast.error('الحد الأقصى هو 10 صور إضافية')
      return
    }

    const filesToProcess = fileArray.slice(0, availableSlots)
    const newBlobUrls: string[] = []
    const newFiles: File[] = []

    for (const f of filesToProcess) {
      try {
        newBlobUrls.push(URL.createObjectURL(f))
        newFiles.push(f)
      } catch (err) {
        console.error(err)
      }
    }

    updateCard(cardIndex, {
      extraImagesBlobUrls: [...card.extraImagesBlobUrls, ...newBlobUrls],
      extraImageFiles: [...(card.extraImageFiles || []), ...newFiles],
    })
    toast.success(`تمت إضافة ${newFiles.length} صورة إضافية`)
  }

  const handleDeleteExtraImage = (cardIndex: number, extraIndex: number) => {
    const card = products[cardIndex]
    if (!card) return
    updateCard(cardIndex, {
      extraImagesBlobUrls: card.extraImagesBlobUrls.filter((_, idx) => idx !== extraIndex),
      extraImageFiles: (card.extraImageFiles || []).filter((_, idx) => idx !== extraIndex),
    })
    toast.success('تم حذف الصورة الإضافية')
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
        uploadedMainUrl: undefined,
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

  // MAGIC TEMPLATE HANDLERS
  const handleMagicCollectionChange = async (colId: string) => {
    setMagicTemplate(prev => ({ ...prev, collectionId: colId, subCategoryIds: [] }))
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

  const toggleMagicSubCategory = (subCatId: string) => {
    setMagicTemplate(prev => {
      const exists = prev.subCategoryIds.includes(subCatId)
      return {
        ...prev,
        subCategoryIds: exists 
          ? prev.subCategoryIds.filter(id => id !== subCatId)
          : [...prev.subCategoryIds, subCatId]
      }
    })
  }

  // COPY SPECIFIC CARD DATA TO ALL OTHER UNSAVED CARDS
  const handleApplyCardToAllOthers = (cardIndex: number) => {
    const sourceCard = products[cardIndex]
    if (!sourceCard) return

    if (!sourceCard.name && !sourceCard.price && !sourceCard.collectionId && sourceCard.subCategoryIds.length === 0) {
      toast.error('املأ بعض البيانات في هذا المنتج أولاً لنسخها للبقية')
      return
    }

    let copiedCount = 0
    setProducts(prev => prev.map((card, idx) => {
      if (idx === cardIndex || card.isSaved) return card
      copiedCount++
      return {
        ...card,
        name: sourceCard.name || card.name,
        price: sourceCard.price || card.price,
        collectionId: sourceCard.collectionId || card.collectionId,
        subCategoryIds: sourceCard.subCategoryIds.length > 0 ? [...sourceCard.subCategoryIds] : card.subCategoryIds,
        hasSizes: sourceCard.hasSizes,
        availableSizes: [...sourceCard.availableSizes],
        supplierId: sourceCard.supplierId || card.supplierId,
        stock: sourceCard.stock || card.stock,
      }
    }))

    // Also sync to magicTemplate so it reflects in the top panel
    setMagicTemplate({
      name: sourceCard.name,
      price: sourceCard.price,
      collectionId: sourceCard.collectionId,
      subCategoryIds: [...sourceCard.subCategoryIds],
      hasSizes: sourceCard.hasSizes,
      availableSizes: [...sourceCard.availableSizes],
      supplierId: sourceCard.supplierId,
      stock: sourceCard.stock,
    })

    toast.success(`تم نسخ وتطبيق بيانات المنتج #${cardIndex + 1} على ${copiedCount} بطاقة! ✨`)
  }

  // APPLY MAGIC TEMPLATE TO ALL UNSAVED CARDS (PREVIEW ONLY)
  const handleApplyMagicToAllCards = () => {
    if (!magicTemplate.name && !magicTemplate.price && !magicTemplate.collectionId && magicTemplate.subCategoryIds.length === 0) {
      toast.error('يرجى كتابة الاسم أو السعر أو تحديد المجموعة في لوحة التحكم السريع أولاً')
      return
    }

    let modifiedCount = 0
    setProducts(prev => prev.map(card => {
      if (card.isSaved) return card
      modifiedCount++
      return {
        ...card,
        name: magicTemplate.name ? magicTemplate.name : card.name,
        price: magicTemplate.price ? magicTemplate.price : card.price,
        collectionId: magicTemplate.collectionId ? magicTemplate.collectionId : card.collectionId,
        subCategoryIds: magicTemplate.subCategoryIds.length > 0 ? [...magicTemplate.subCategoryIds] : card.subCategoryIds,
        hasSizes: magicTemplate.hasSizes !== undefined ? magicTemplate.hasSizes : card.hasSizes,
        availableSizes: magicTemplate.availableSizes.length > 0 ? [...magicTemplate.availableSizes] : card.availableSizes,
        supplierId: magicTemplate.supplierId !== undefined ? magicTemplate.supplierId : card.supplierId,
        stock: magicTemplate.stock ? magicTemplate.stock : card.stock,
      }
    }))

    toast.success(`تمت تعبئة بيانات ${modifiedCount} منتج بنجاح! يمكنك مراجعتها أو حفظها فوراً ✨`)
  }

  // CORE SINGLE PRODUCT SAVE HELPER (Used by both single save & batch save)
  const executeSaveProduct = async (
    card: BulkProductCard,
    cardIndex: number,
    overrides?: Partial<BulkProductCard>
  ): Promise<{ success: boolean; error?: string }> => {
    const finalCard = { ...card, ...overrides }
    const name = finalCard.name.trim()
    const numPrice = Number(finalCard.price)

    if (!name) {
      return { success: false, error: 'اسم المنتج مطلوب' }
    }
    if (!finalCard.price || isNaN(numPrice) || numPrice <= 0) {
      return { success: false, error: 'السعر غير صحيح' }
    }

    updateCard(cardIndex, { isSaving: true, ...overrides })

    try {
      // 1. If product is already saved in DB, execute UPDATE (تعديل)
      if (finalCard.isSaved && finalCard.savedProductId) {
        const updateRes = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: finalCard.savedProductId,
            name,
            price: numPrice,
            stock: finalCard.stock ? Number(finalCard.stock) : 10,
            costPrice: finalCard.costPrice ? Number(finalCard.costPrice) : null,
            collectionId: finalCard.collectionId || null,
            subCategoryId: finalCard.subCategoryIds[0] || null,
            subCategoryIds: finalCard.subCategoryIds,
            supplierId: finalCard.supplierId || null,
            description: finalCard.description || null,
            hasSizes: finalCard.hasSizes,
            availableSizes: finalCard.availableSizes,
          }),
        })

        const updateJson = await updateRes.json().catch(() => ({ success: false, error: 'خطأ في استجابة الخادم' }))
        if (!updateJson.success) {
          throw new Error(updateJson.error || 'فشل تعديل المنتج')
        }

        updateCard(cardIndex, { isSaving: false })
        return { success: true }
      }

      // 2. Otherwise, NEW PRODUCT (إضافة جديدة)
      let uploadedMainUrl = finalCard.uploadedMainUrl
      if (!uploadedMainUrl) {
        let fileToUpload: File
        if (finalCard.mainImageFile) {
          fileToUpload = finalCard.mainImageFile
        } else {
          const fetchBlob = await fetch(finalCard.mainImageBlobUrl)
          const blob = await fetchBlob.blob()
          fileToUpload = new File([blob], `product-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
        }

        try {
          const compressed = await compressImageClientSide(fileToUpload)
          if (compressed && compressed.size > 0) fileToUpload = compressed
        } catch (cErr) {
          console.warn('Compression error:', cErr)
        }

        const fd = new FormData()
        fd.append('file', fileToUpload, fileToUpload.name || 'product.webp')
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        })

        if (!upRes.ok) {
          const errJson = await upRes.json().catch(() => ({}))
          throw new Error(errJson.error || 'فشل رفع صورة المنتج إلى التخزين')
        }
        const upData = await upRes.json()
        uploadedMainUrl = upData.url
      }

      // Upload extra images if any
      const uploadedExtras: string[] = []
      if (finalCard.extraImagesBlobUrls.length > 0) {
        for (let i = 0; i < finalCard.extraImagesBlobUrls.length; i++) {
          let extraFile = finalCard.extraImageFiles?.[i]
          if (!extraFile) {
            const fetchBlob = await fetch(finalCard.extraImagesBlobUrls[i])
            const blob = await fetchBlob.blob()
            extraFile = new File([blob], `extra-${i}-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
          }
          const fd = new FormData()
          fd.append('file', extraFile)
          const upRes = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' })
          if (upRes.ok) {
            const upData = await upRes.json()
            if (upData.url) uploadedExtras.push(upData.url)
          }
        }
      }

      // Create product in database
      const saveRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          price: numPrice,
          stock: finalCard.stock ? Number(finalCard.stock) : 10,
          costPrice: finalCard.costPrice ? Number(finalCard.costPrice) : null,
          collectionId: finalCard.collectionId || null,
          subCategoryId: finalCard.subCategoryIds[0] || null,
          subCategoryIds: finalCard.subCategoryIds,
          supplierId: finalCard.supplierId || null,
          description: finalCard.description || null,
          imageUrl: uploadedMainUrl,
          images: uploadedExtras,
          hasSizes: finalCard.hasSizes,
          availableSizes: finalCard.availableSizes,
          isActive: true,
        }),
      })

      const saveJson = await saveRes.json().catch(() => ({ success: false, error: 'خطأ في استجابة الخادم' }))
      if (!saveJson.success) {
        throw new Error(saveJson.error || 'فشل حفظ المنتج في قاعدة البيانات')
      }

      const createdId = saveJson.product?.id || `saved-${Date.now()}`

      updateCard(cardIndex, {
        isSaved: true,
        savedProductId: createdId,
        uploadedMainUrl,
        isSaving: false,
      })

      return { success: true }
    } catch (err: any) {
      console.error('Save error for card', cardIndex, err)
      updateCard(cardIndex, { isSaving: false })
      return { success: false, error: err.message || 'حدث خطأ أثناء حفظ المنتج' }
    }
  }

  // SAVE OR UPDATE PRODUCT HANDLER (No Page Reload)
  const handleSaveOrUpdateCard = async (cardIndex: number) => {
    const card = products[cardIndex]
    if (!card) return

    const res = await executeSaveProduct(card, cardIndex)
    if (!res.success) {
      toast.error(res.error || 'فشل حفظ المنتج')
      return
    }

    if (card.isSaved) {
      toast.success(`تم تعديل بيانات "${card.name}" بنجاح! ✏️`)
    } else {
      toast.success(`تمت إضافة "${card.name}" بنجاح! 🚀`)

      // Auto pre-fill next card with this card's collection and subcategories to save time
      if (autoPrefillFromPrevious && cardIndex + 1 < products.length) {
        const nextCard = products[cardIndex + 1]
        if (nextCard && !nextCard.isSaved) {
          updateCard(cardIndex + 1, {
            collectionId: nextCard.collectionId || card.collectionId,
            subCategoryIds: nextCard.subCategoryIds.length > 0 ? nextCard.subCategoryIds : [...card.subCategoryIds],
            supplierId: nextCard.supplierId || card.supplierId,
            hasSizes: nextCard.hasSizes || card.hasSizes,
            availableSizes: nextCard.availableSizes.length > 0 ? nextCard.availableSizes : [...card.availableSizes],
          })
        }
      }
    }
  }

  // MAGIC BUTTON: APPLY TO ALL AND SAVE/UPLOAD EVERYTHING TO DB
  const handleMagicApplyAndSaveAll = async () => {
    const unsavedCards = products.map((p, idx) => ({ card: p, index: idx })).filter(item => !item.card.isSaved)
    
    if (unsavedCards.length === 0) {
      toast.success('جميع المنتجات في القائمة محفوظة ومضافة بالفعل! 🎉')
      return
    }

    const effectiveName = magicTemplate.name.trim()
    const effectivePrice = magicTemplate.price.trim()

    // Validation
    const missingName = unsavedCards.find(item => !item.card.name.trim() && !effectiveName)
    if (missingName) {
      toast.error('يرجى تحديد أو كتابة اسم المنتج في لوحة الاعتماد السريع أو في البطاقة')
      return
    }

    const missingPrice = unsavedCards.find(item => {
      const p = item.card.price || effectivePrice
      return !p || isNaN(Number(p)) || Number(p) <= 0
    })
    if (missingPrice) {
      toast.error('يرجى تحديد سعر صالح للمنتجات (مثل 2500)')
      return
    }

    setIsBatchSaving(true)
    let savedCount = 0
    let failedCount = 0

    for (let i = 0; i < unsavedCards.length; i++) {
      const { card, index } = unsavedCards[i]
      
      const overrides: Partial<BulkProductCard> = {
        name: card.name.trim() || effectiveName,
        price: card.price || effectivePrice,
        collectionId: card.collectionId || magicTemplate.collectionId,
        subCategoryIds: card.subCategoryIds.length > 0 ? card.subCategoryIds : magicTemplate.subCategoryIds,
        hasSizes: card.hasSizes || magicTemplate.hasSizes,
        availableSizes: card.availableSizes.length > 0 ? card.availableSizes : magicTemplate.availableSizes,
        supplierId: card.supplierId || magicTemplate.supplierId,
        stock: card.stock || magicTemplate.stock || '10',
      }

      setBatchProgress({
        current: i + 1,
        total: unsavedCards.length,
        currentName: overrides.name || 'منتج',
      })

      const res = await executeSaveProduct(card, index, overrides)
      if (res.success) {
        savedCount++
      } else {
        failedCount++
        toast.error(`تعذر إضافة منتج #${index + 1}: ${res.error}`)
      }
    }

    setIsBatchSaving(false)
    setBatchProgress({ current: 0, total: 0 })

    if (savedCount > 0) {
      toast.success(`🎉 تم بنجاح اعتماد ورفع ${savedCount} منتج للمتجر دفعة واحدة!`, {
        duration: 6000
      })
    }
  }

  const savedCount = products.filter(p => p.isSaved).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-gray-900">الإضافة المتعددة للمنتجات</h2>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              قائمة متسلسلة فلاش ⚡
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            اختر صوراً متعددة، ثم مرر للأسفل واملأ بيانات كل منتج واضغط إضافة دون أي تحديث للصفحة!
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link 
            href="/admin/products"
            className="flex-1 sm:flex-none text-center px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            العودة للمنتجات
          </Link>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>إضافة صور</span>
          </button>
        </div>
      </div>

      {/* Hidden file inputs for batch upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input 
        type="file" 
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Upload Dropzone if no products yet */}
      {products.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-10 md:p-14 text-center space-y-4 shadow-sm hover:border-black transition-all">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">اختر صور المنتجات للبدء</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              يمكنك اختيار حتى 50 صورة دفعة واحدة من ألبوم الهاتف أو جهاز الكمبيوتر. ستظهر المنتجات متسلسلة تحت بعضها لإدخالها فوراً.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
            >
              <Images className="w-4 h-4 text-amber-400" />
              <span>اختيار صور من الألبوم</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all active:scale-95"
            >
              <Camera className="w-4 h-4 text-gray-600" />
              <span>التقاط بالكاميرا</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Progress & Actions Bar when products exist */}
      {products.length > 0 && (
        <div className="sticky top-3 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
              {savedCount}/{products.length}
            </div>
            <div>
              <div className="text-xs font-black text-gray-900">
                {savedCount === products.length 
                  ? '🎉 تم حفظ جميع المنتجات بنجاح!' 
                  : `تم حفظ ${savedCount} من أصل ${products.length} منتج`}
              </div>
              <div className="w-32 md:w-48 bg-gray-100 h-2 rounded-full overflow-hidden mt-1 border border-gray-200">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${(savedCount / products.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-all"
            >
              + إضافة صور
            </button>
            <button
              type="button"
              onClick={() => setShowStockSupplier(!showStockSupplier)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-all"
            >
              {showStockSupplier ? 'إخفاء المخزون' : 'إظهار المخزون'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Batch Saving Progress Indicator */}
      {isBatchSaving && (
        <div className="fixed top-4 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 bg-black/90 text-white backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-4 min-w-[320px] max-w-lg animate-in fade-in slide-in-from-top-4">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-amber-300">جاري الرفع والحفظ التلقائي في المتجر...</span>
              <span className="text-white font-mono">{batchProgress.current} / {batchProgress.total}</span>
            </div>
            <p className="text-[11px] text-gray-300 truncate mt-0.5 font-medium">{batchProgress.currentName}</p>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(batchProgress.current / Math.max(batchProgress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* THE MAGIC BUTTON & BULK CONTROL PANEL */}
      {products.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-amber-500/5 rounded-3xl border-2 border-amber-300/80 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base md:text-lg font-black text-gray-900">
                    الزر السحري: الاعتماد السريع لجميع المنتجات دفعة واحدة
                  </h3>
                  <span className="hidden sm:inline-block bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                    وفر وقتك بنقرة واحدة
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  حدد الاسم والسعر والتصنيف هنا، واضغط على الزر السحري لتعبئة ورفع كل المنتجات غير المحفوظة فوراً للمتجر!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMagicPanelOpen(!isMagicPanelOpen)}
              className="p-1.5 rounded-lg hover:bg-amber-100 text-gray-600 transition-colors"
            >
              {isMagicPanelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {isMagicPanelOpen && (
            <div className="space-y-4 pt-2 border-t border-amber-200/60">
              {/* Name & Price in Magic Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Master Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-800">
                    اسم المنتج الموحد لجميع الصور
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: فستان نسائي"
                    value={magicTemplate.name}
                    onChange={(e) => setMagicTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border-amber-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-xs"
                  />
                  {/* Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-500 font-bold">اقتراحات:</span>
                    {NAME_SUGGESTIONS.map((phrase) => {
                      const isSelected = magicTemplate.name.trim() === phrase
                      return (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => setMagicTemplate(prev => ({ ...prev, name: phrase }))}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-amber-400 text-black border-amber-500 shadow-xs scale-105'
                              : 'bg-white hover:bg-amber-100 text-gray-800 border-amber-200'
                          }`}
                        >
                          {phrase}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Master Price */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-800">
                    السعر الموحد لجميع الصور (ر.ي)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 2500"
                    value={magicTemplate.price}
                    onChange={(e) => setMagicTemplate(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    min="0"
                    dir="ltr"
                    className="w-full rounded-xl border-amber-300 border p-2.5 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-xs"
                  />
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto p-1 bg-white/70 rounded-xl border border-amber-200">
                    {PRICE_PRESETS.map((presetPrice) => (
                      <button
                        key={presetPrice}
                        type="button"
                        onClick={() => setMagicTemplate(prev => ({ ...prev, price: presetPrice }))}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all border ${
                          magicTemplate.price === presetPrice
                            ? 'bg-amber-400 text-black border-amber-500 shadow-xs scale-105'
                            : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {presetPrice}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Master Collection & SubCategories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المجموعة الرئيسية الموحدة</label>
                  <select
                    value={magicTemplate.collectionId}
                    onChange={(e) => handleMagicCollectionChange(e.target.value)}
                    className="w-full rounded-xl border-amber-300 border p-2.5 text-xs text-gray-900 bg-white focus:border-black focus:outline-none shadow-xs"
                  >
                    <option value="">بدون مجموعة</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategories for magic template */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الفروع والمجموعات الفرعية</label>
                  {magicTemplate.collectionId && (subCategoriesMap[magicTemplate.collectionId] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white/70 rounded-xl border border-amber-200 min-h-[42px]">
                      {(subCategoriesMap[magicTemplate.collectionId] || []).map(subCat => {
                        const isSelected = magicTemplate.subCategoryIds.includes(subCat.id)
                        return (
                          <button
                            key={subCat.id}
                            type="button"
                            onClick={() => toggleMagicSubCategory(subCat.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{subCat.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 p-2.5 bg-white/50 rounded-xl border border-dashed border-gray-200">
                      اختر المجموعة الرئيسية أولاً لعرض أقسامها الفرعية
                    </div>
                  )}
                </div>
              </div>

              {/* Master Sizes */}
              <div className="pt-1">
                <SizeSelector
                  hasSizes={magicTemplate.hasSizes}
                  onHasSizesChange={(val) => setMagicTemplate(prev => ({ ...prev, hasSizes: val }))}
                  availableSizes={magicTemplate.availableSizes}
                  onChangeSizes={(sizes) => setMagicTemplate(prev => ({ ...prev, availableSizes: sizes }))}
                />
              </div>

              {/* ACTION BUTTONS OF THE MAGIC PANEL */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    يوجد <strong className="text-gray-900">{products.filter(p => !p.isSaved).length}</strong> منتج بانتظار الإضافة
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Fill cards only (preview) */}
                  <button
                    type="button"
                    disabled={isBatchSaving || products.filter(p => !p.isSaved).length === 0}
                    onClick={handleApplyMagicToAllCards}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-100/70 text-gray-800 border border-amber-300 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4 text-amber-600" />
                    <span>تعبئة البطاقات فقط (للمعاينة)</span>
                  </button>

                  {/* MAGIC BUTTON: APPLY & SAVE ALL */}
                  <button
                    type="button"
                    disabled={isBatchSaving || products.filter(p => !p.isSaved).length === 0}
                    onClick={handleMagicApplyAndSaveAll}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-xs md:text-sm font-black shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 ring-2 ring-amber-400/50"
                  >
                    {isBatchSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>جاري الحفظ ({batchProgress.current}/{batchProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>✨ اعتماد ورفع الكل للمتجر دفعة واحدة 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* THE VERTICAL STACK OF PRODUCT FORMS */}
      <div className="space-y-6">
        {products.map((card, idx) => {
          const subCatsForCollection = card.collectionId ? (subCategoriesMap[card.collectionId] || []) : []

          return (
            <div 
              key={card.id}
              className={`bg-white rounded-3xl border transition-all duration-300 p-5 md:p-6 shadow-sm ${
                card.isSaved 
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card Header: Product Number, Status Badge & Delete Button */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-gray-900 text-white text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  {card.isSaved ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      تم الحفظ بنجاح
                    </span>
                  ) : card.isSaving ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      جاري الحفظ...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      بانتظار الإضافة
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {!card.isSaved && (
                    <button
                      type="button"
                      onClick={() => handleApplyCardToAllOthers(idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95"
                      title="نسخ وتطبيق بيانات هذا المنتج على كافة الصور الأخرى غير المحفوظة"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>تطبيق بياناته للبقية</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIndex(idx)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="حذف هذا المنتج من القائمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-5">
                {/* 1. Main Image & Extra Images (Cols 1-4 on md) */}
                <div className="md:col-span-4 space-y-3">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
                    <Image
                      src={card.mainImageBlobUrl}
                      alt={`منتج ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />

                    {/* Action buttons on image */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center gap-1.5">
                      <label className="flex-1 bg-white/95 hover:bg-white text-gray-900 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all active:scale-95 border border-black/10">
                        <RefreshCw className="w-3 h-3 text-amber-600" />
                        <span>تغيير</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleReplaceMainImage(idx, e.target.files)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenEditor('main', idx)}
                        className="flex-1 bg-black/85 hover:bg-black text-white py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                      >
                        <Crop className="w-3 h-3 text-amber-400" />
                        <span>قص/تعديل</span>
                      </button>
                    </div>
                  </div>

                  {/* Extra Images Thumbnails */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600">صور إضافية ({card.extraImagesBlobUrls.length})</span>
                      {card.extraImagesBlobUrls.length < 10 && (
                        <label className="text-[11px] text-amber-700 hover:underline font-bold cursor-pointer">
                          + إضافة صورة
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAddExtraImage(idx, e.target.files)}
                          />
                        </label>
                      )}
                    </div>

                    {card.extraImagesBlobUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {card.extraImagesBlobUrls.map((extraUrl, eIdx) => (
                          <div key={eIdx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group/extra">
                            <Image src={extraUrl} alt="" fill className="object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => handleDeleteExtraImage(idx, eIdx)}
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded p-0.5 opacity-0 group-hover/extra:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Product Details Inputs (Cols 5-12 on md) */}
                <div className="md:col-span-8 space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1">اسم المنتج *</label>
                    <input
                      type="text"
                      placeholder="مثال: فستان نسائي ميدي أنيق"
                      value={card.name}
                      onChange={(e) => updateCard(idx, { name: e.target.value })}
                      className="w-full rounded-xl border-gray-300 border p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />

                    {/* Quick Name Suggestions - Instant Replace */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-gray-400 font-bold ml-1">اقتراحات سريعة:</span>
                      {NAME_SUGGESTIONS.map((phrase) => {
                        const isSelected = card.name.trim() === phrase
                        return (
                          <button
                            key={phrase}
                            type="button"
                            onClick={() => updateCard(idx, { name: phrase })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border select-none ${
                              isSelected
                                ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 hover:scale-105 active:scale-95'
                            }`}
                          >
                            {phrase}
                          </button>
                        )
                      })}
                      {card.name && (
                        <button
                          type="button"
                          onClick={() => updateCard(idx, { name: '' })}
                          className="text-[11px] text-red-500 hover:underline px-1.5 font-bold mr-auto"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1">السعر (ر.ي) *</label>
                    <input
                      type="number"
                      placeholder="مثال: 2500"
                      value={card.price}
                      onChange={(e) => updateCard(idx, { price: e.target.value })}
                      step="0.01"
                      min="0"
                      dir="ltr"
                      className="w-full rounded-xl border-gray-300 border p-2.5 text-sm font-bold text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />

                    {/* Quick Price Buttons: 500 to 5000 by 250 */}
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto p-1.5 bg-gray-50/80 rounded-xl border border-gray-200">
                      {PRICE_PRESETS.map((presetPrice) => (
                        <button
                          key={presetPrice}
                          type="button"
                          onClick={() => updateCard(idx, { price: presetPrice })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                            card.price === presetPrice
                              ? 'bg-amber-400 text-black border-amber-500 shadow-sm scale-105'
                              : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-300 active:scale-95'
                          }`}
                        >
                          {presetPrice}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collections and SubCategories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">المجموعة الرئيسية</label>
                      <select
                        value={card.collectionId}
                        onChange={(e) => handleCollectionChange(idx, e.target.value)}
                        className="w-full rounded-xl border-gray-300 border p-2 text-xs text-gray-900 bg-white focus:border-black focus:outline-none"
                      >
                        <option value="">بدون مجموعة</option>
                        {collections.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {showStockSupplier && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">المورد</label>
                        <select
                          value={card.supplierId || ''}
                          onChange={(e) => updateCard(idx, { supplierId: e.target.value })}
                          className="w-full rounded-xl border-gray-300 border p-2 text-xs text-gray-900 bg-white focus:border-black focus:outline-none"
                        >
                          <option value="">بدون مورد</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* SubCategory Chips */}
                  {subCatsForCollection.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-gray-600">الفروع والمجموعات الفرعية:</span>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200">
                        {subCatsForCollection.map(subCat => {
                          const isSelected = card.subCategoryIds.includes(subCat.id)
                          return (
                            <button
                              key={subCat.id}
                              type="button"
                              onClick={() => toggleSubCategory(idx, subCat.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{subCat.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  <div className="pt-1">
                    <SizeSelector
                      hasSizes={card.hasSizes}
                      onHasSizesChange={(val) => updateCard(idx, { hasSizes: val })}
                      availableSizes={card.availableSizes}
                      onChangeSizes={(sizes) => updateCard(idx, { availableSizes: sizes })}
                    />
                  </div>

                  {/* Optional Stock & Cost Price */}
                  {showStockSupplier && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">الكمية المتوفرة</label>
                        <input
                          type="number"
                          value={card.stock}
                          onChange={(e) => updateCard(idx, { stock: e.target.value })}
                          className="w-full rounded-xl border-gray-300 border p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">سعر التكلفة (ر.ي)</label>
                        <input
                          type="number"
                          value={card.costPrice}
                          onChange={(e) => updateCard(idx, { costPrice: e.target.value })}
                          className="w-full rounded-xl border-gray-300 border p-2 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Big Action Button for this specific card */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">
                      {card.isSaved ? 'المنتج مضاف في المتجر، يمكنك تعديله في أي وقت' : 'انقر إضافة وواصل التمرير للمنتج التالي'}
                    </span>

                    {card.isSaved ? (
                      <button
                        type="button"
                        disabled={card.isSaving}
                        onClick={() => handleSaveOrUpdateCard(idx)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {card.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري التعديل...</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" />
                            <span>تعديل المنتج ✏️</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={card.isSaving}
                        onClick={() => handleSaveOrUpdateCard(idx)}
                        className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-black hover:bg-gray-800 text-white font-black text-xs md:text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {card.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            <span>جاري الإضافة...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>إضافة هذا المنتج 🚀</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Final Actions */}
      {products.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm">
          <p className="text-sm font-bold text-gray-800">
            {savedCount === products.length 
              ? '🎉 رائع جداً! لقد أكملت إضافة جميع المنتجات المعروضة في هذه الصفحة.'
              : `أنجزت ${savedCount} من ${products.length} منتجاً حتى الآن.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow transition-all active:scale-95"
            >
              + إضافة دفعة صور أخرى
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              الذهاب لقائمة المنتجات
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-black text-gray-900">هل تريد بالتأكيد حذف هذا المنتج من القائمة؟</h4>
            <p className="text-xs text-gray-500">سيتم إزالة الصورة والبيانات الخاصة بهذه البطاقة فقط من الشاشة.</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteIndex(null)}
                className="flex-1 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCard(confirmDeleteIndex)}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal (Cropping, blur prices, etc.) */}
      {editingImage.isOpen && (
        <ImageEditorModal
          isOpen={editingImage.isOpen}
          imageUrl={editingImage.imageUrl}
          onClose={() => setEditingImage(prev => ({ ...prev, isOpen: false }))}
          onSave={handleSaveEditor}
        />
      )}
    </div>
  )
}
