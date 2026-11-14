'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Trash2, 
  ArrowRight, 
  Filter, 
  Search, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  Package, 
  Check, 
  Zap, 
  Loader2, 
  Calendar,
  Layers,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type CollectionItem = {
  id: string
  name: string
}

type SubCategoryItem = {
  id: string
  name: string
  collectionId: string
}

type ProductItem = {
  id: string
  name: string
  slug: string
  shortCode: string | null
  price: any
  stock: number
  imageUrl: string | null
  createdAt: string
  collection: { id: string; name: string } | null
  subCategory: { id: string; name: string } | null
}

interface CleanupClientProps {
  initialCollections: CollectionItem[]
  initialSubCategories: SubCategoryItem[]
}

export default function CleanupClient({
  initialCollections,
  initialSubCategories,
}: CleanupClientProps) {
  // State
  const [products, setProducts] = useState<ProductItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  // Filters
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Quick mode toggle: skip confirmation for 1-click delete
  const [fastDeleteMode, setFastDeleteMode] = useState<boolean>(false)

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filtered subcategories based on chosen collection
  const availableSubCategories = selectedCollection
    ? initialSubCategories.filter((sc) => sc.collectionId === selectedCollection)
    : initialSubCategories

  // Fetch products from cleanup API
  const fetchProducts = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const params = new URLSearchParams()
        params.set('page', targetPage.toString())
        params.set('limit', '50')
        if (selectedCollection) params.set('collectionId', selectedCollection)
        if (selectedSubCategory) params.set('subCategoryId', selectedSubCategory)
        if (debouncedSearch) params.set('search', debouncedSearch)

        const res = await fetch(`/api/admin/products/cleanup?${params.toString()}`, {
          cache: 'no-store',
        })
        const data = await res.json()

        if (data.success) {
          if (append) {
            setProducts((prev) => [...prev, ...data.products])
          } else {
            setProducts(data.products)
          }
          setTotalCount(data.totalCount)
          setHasMore(data.hasMore)
          setPage(targetPage)
        } else {
          toast.error(data.error || 'تعذر تحميل المنتجات')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        toast.error('حدث خطأ في الاتصال بالخادم')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [selectedCollection, selectedSubCategory, debouncedSearch]
  )

  // Refetch when filters or search change
  useEffect(() => {
    fetchProducts(1, false)
    setSelectedIds(new Set())
  }, [fetchProducts])

  // Toggle selection for a single product
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select all currently loaded products
  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  // Single delete (with or without confirmation based on fastDeleteMode)
  const handleDeleteSingle = async (e: React.MouseEvent, product: ProductItem) => {
    e.stopPropagation()

    if (!fastDeleteMode) {
      const ok = window.confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟`)
      if (!ok) return
    }

    setDeletingId(product.id)
    try {
      const res = await fetch('/api/admin/products/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      })
      const data = await res.json()

      if (data.success) {
        // حذف فوري من الحالة دون أي reload أو اهتزاز في التمرير
        setProducts((prev) => prev.filter((p) => p.id !== product.id))
        setTotalCount((prev) => Math.max(0, prev - 1))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(product.id)
          return next
        })
        toast.success(`تم حذف "${product.name}" 🗑️`, { duration: 2500 })
      } else {
        toast.error(data.error || 'فشل حذف المنتج')
      }
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  // Bulk delete selected products
  const handleDeleteBulk = async () => {
    const count = selectedIds.size
    if (count === 0) return

    const ok = window.confirm(
      `⚠️ تحذير: أنت على وشك حذف ${count} منتج نهائياً من الموقع والمخزن دفعة واحدة.\nهل تريد المتابعة بالتأكيد؟`
    )
    if (!ok) return

    setIsDeletingBulk(true)
    const idsToDelete = Array.from(selectedIds)

    try {
      const res = await fetch('/api/admin/products/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      })
      const data = await res.json()

      if (data.success) {
        const deletedSet = new Set(idsToDelete)
        // إزالة العناصر المحذوفة من القائمة الحالية بسلاسة وتثبيت مكان الشاشة
        setProducts((prev) => prev.filter((p) => !deletedSet.has(p.id)))
        setTotalCount((prev) => Math.max(0, prev - (data.deletedCount || count)))
        setSelectedIds(new Set())
        toast.success(`🎉 تم حذف ${data.deletedCount || count} منتج بنجاح في الخلفية!`, {
          duration: 4000,
        })
      } else {
        toast.error(data.error || 'فشل حذف المنتجات المحددة')
      }
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء عملية الحذف الجماعي')
    } finally {
      setIsDeletingBulk(false)
    }
  }

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('ar-YE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-gray-900">
              تنظيف وتصفية المخزون 🧹
            </h1>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              فرز الأقدم أولاً ⏱️
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            يعرض جميع المنتجات من الأقدم إلى الأحدث للتخلص السريع من البضاعة المنتهية بنقرة واحدة وفي الخلفية بصمت.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمنتجات
          </Link>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Collection Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              المجموعة:
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => {
                setSelectedCollection(e.target.value)
                setSelectedSubCategory('')
              }}
              className="w-full text-xs md:text-sm font-semibold border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none"
            >
              <option value="">جميع المجموعات ({initialCollections.length})</option>
              {initialCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* SubCategory Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              المجموعة الفرعية:
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full text-xs md:text-sm font-semibold border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none"
            >
              <option value="">جميع المجموعات الفرعية</option>
              {availableSubCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              بحث سريع باسم أو كود المنتج:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو shahrzad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs md:text-sm border border-gray-300 rounded-xl pr-9 pl-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar: Select All & Fast Mode Toggle */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              disabled={products.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50"
            >
              {selectedIds.size === products.length && products.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-rose-600" />
                  إلغاء تحديد الكل
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-gray-500" />
                  تحديد كل المعروض ({products.length})
                </>
              )}
            </button>

            <span className="text-xs text-gray-500 font-semibold mr-2">
              إجمالي المنتجات المتبقية المطابقة: <strong className="text-gray-900">{totalCount}</strong>
            </span>
          </div>

          {/* Quick 1-click Delete Mode toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={fastDeleteMode}
              onChange={(e) => setFastDeleteMode(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
              وضع الحذف الفوري بنقرة واحدة (بدون نافذة تأكيد)
            </span>
          </label>
        </div>
      </div>

      {/* Products List / Cards */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600">جاري تحميل المنتجات الأقدم...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✨
          </div>
          <h3 className="text-base font-black text-gray-900">
            رائع! لا توجد منتجات مطابقة لهذا الفلتر
          </h3>
          <p className="text-xs text-gray-500">
            تم تنظيف هذه المنتجات أو لا توجد عناصر مطابقة لخيارات البحث.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product, idx) => {
            const isSelected = selectedIds.has(product.id)
            const isDeleting = deletingId === product.id

            return (
              <div
                key={product.id}
                onClick={() => toggleSelect(product.id)}
                className={`flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isDeleting ? 'opacity-40 pointer-events-none scale-[0.98]' : ''}`}
              >
                {/* Right: Checkbox, Thumbnail, Product Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(product.id)
                    }}
                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                    )}
                  </div>

                  {/* Image Thumbnail */}
                  <div className="w-12 h-14 md:w-14 md:h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative border border-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                        بدون صورة
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs md:text-sm font-bold text-gray-900 truncate">
                        {product.name}
                      </h4>
                      {product.shortCode && (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {product.shortCode}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                      <span className="font-bold text-gray-900">
                        {Number(product.price).toLocaleString()} ريال
                      </span>
                      <span>•</span>
                      <span className={product.stock <= 0 ? 'text-rose-600 font-bold' : 'text-gray-600'}>
                        المخزون: {product.stock}
                      </span>
                      {product.collection && (
                        <>
                          <span>•</span>
                          <span className="text-gray-600 font-medium">
                            {product.collection.name}
                            {product.subCategory && ` / ${product.subCategory.name}`}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(product.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left: Quick Delete Button */}
                <div className="shrink-0">
                  <button
                    onClick={(e) => handleDeleteSingle(e, product)}
                    disabled={isDeleting}
                    title={fastDeleteMode ? 'حذف مباشر بنقرة واحدة' : 'حذف هذا المنتج'}
                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                      fastDeleteMode
                        ? 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border-rose-200'
                    }`}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">حذف</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => fetchProducts(page + 1, true)}
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs md:text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    جاري تحميل المزيد من المنتجات القديمة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    تحميل 50 منتج قديم إضافي (يواصل من مكانك دون إعادة تحميل)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Action Bar for Bulk Deletion */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl bg-gray-950/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-rose-600/30 border border-rose-500 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">
              {selectedIds.size}
            </span>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-bold truncate">
                تم تحديد {selectedIds.size} منتج للحذف
              </p>
              <p className="text-[10px] text-gray-400">
                سيتم حذفها في الخلفية وستظل في مكانك دون أي تحديث للصفحة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isDeletingBulk}
              className="px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              إلغاء التحديد
            </button>
            <button
              onClick={handleDeleteBulk}
              disabled={isDeletingBulk}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/50 transition-all disabled:opacity-50"
            >
              {isDeletingBulk ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  حذف الكل المحدد ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
