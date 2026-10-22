'use client'

import React, { useState, useEffect, useTransition, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'
import { Loader2, ArrowDownCircle, CheckCircle2 } from 'lucide-react'

export interface ProductItemData {
  id: string
  slug: string
  shortCode?: string | null
  name: string
  brand?: string | null
  collectionName?: string | null
  subCategoryName?: string | null
  isNew48h?: boolean
  price: number
  compareAtPrice?: number | null
  imageUrl: string
  hasSizes?: boolean
}

interface ProductsListWithLoadMoreProps {
  initialProducts: ProductItemData[]
  totalCount: number
  pageSize: number
  currency: string
}

export default function ProductsListWithLoadMore({
  initialProducts,
  totalCount,
  pageSize,
  currency,
}: ProductsListWithLoadMoreProps) {
  const searchParams = useSearchParams()
  const filterKey = searchParams.toString()
  const cacheKey = `products_cache_${filterKey}`

  const [products, setProducts] = useState<ProductItemData[]>(initialProducts)
  const [page, setPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [, startTransition] = useTransition()
  const isFirstMount = useRef(true)

  // 1. Restore state on mount or reset when filters change
  useEffect(() => {
    let restored = false

    try {
      if (typeof window !== 'undefined') {
        const lastClicked = sessionStorage.getItem('basmatanaqa_last_clicked_product')
        const lastScrollY = sessionStorage.getItem('basmatanaqa_last_scroll_y')
        const cachedRaw = sessionStorage.getItem(cacheKey)

        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw)
          if (
            cached &&
            Array.isArray(cached.products) &&
            cached.products.length >= initialProducts.length
          ) {
            setProducts(cached.products)
            setPage(cached.page || 1)
            restored = true
          }
        }

        // Restore scroll position to clicked product
        if (lastClicked || lastScrollY) {
          const targetY = lastScrollY ? parseInt(lastScrollY, 10) : null

          const attemptScroll = (retries: number) => {
            let scrolled = false

            if (lastClicked) {
              const el = document.getElementById(`product-${lastClicked}`)
              if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'instant' })
                sessionStorage.removeItem('basmatanaqa_last_clicked_product')
                sessionStorage.removeItem('basmatanaqa_last_scroll_y')
                scrolled = true
              }
            }

            if (!scrolled && targetY !== null && !isNaN(targetY) && targetY > 0) {
              window.scrollTo({ top: targetY, behavior: 'instant' })
              sessionStorage.removeItem('basmatanaqa_last_scroll_y')
              sessionStorage.removeItem('basmatanaqa_last_clicked_product')
              scrolled = true
            }

            if (!scrolled && retries > 0) {
              setTimeout(() => attemptScroll(retries - 1), 60)
            }
          }

          // Delay slightly so DOM can finish rendering the list
          setTimeout(() => attemptScroll(8), 50)
        }
      }
    } catch (e) {
      console.error('Error during products state restoration:', e)
    }

    if (!restored) {
      setProducts(initialProducts)
      setPage(1)
    }

    isFirstMount.current = false
  }, [filterKey, initialProducts, cacheKey])

  // 2. Persist loaded products to sessionStorage
  useEffect(() => {
    if (products.length > 0 && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            products,
            page,
            totalCount,
            savedAt: Date.now(),
          })
        )
      } catch (err) {
        // Ignore quota limits
      }
    }
  }, [products, page, cacheKey, totalCount])

  const totalLoaded = products.length
  const hasMore = totalLoaded < totalCount
  const progressPercent = Math.min(100, Math.round((totalLoaded / (totalCount || 1)) * 100))

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return

    const nextPage = page + 1
    setIsLoading(true)

    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', nextPage.toString())
      params.set('pageSize', pageSize.toString())

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to load more products')
      }

      const data = await res.json()
      if (data.products && Array.isArray(data.products)) {
        startTransition(() => {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newUnique = data.products.filter((p: ProductItemData) => !existingIds.has(p.id))
            return [...prev, ...newUnique]
          })
          setPage(nextPage)
        })
      }
    } catch (err) {
      console.error('Error loading more products:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              shortCode: product.shortCode,
              price: product.price,
              compareAtPrice: product.compareAtPrice ?? null,
              imageUrl: product.imageUrl,
              brand: product.brand || undefined,
              collectionName: product.collectionName,
              subCategoryName: product.subCategoryName,
              isNew48h: product.isNew48h,
              hasSizes: product.hasSizes,
            }}
            currency={currency}
            priority={index < 4}
          />
        ))}
      </div>

      {/* Progress & Load More Section */}
      <div className="mt-12 mb-8 flex flex-col items-center justify-center">
        {/* Progress Bar & Counter */}
        {totalCount > 0 && (
          <div className="w-full max-w-xs flex flex-col items-center gap-2 mb-4 text-xs text-foreground/60">
            <div className="flex justify-between w-full font-medium">
              <span>تم عرض {totalLoaded} من {totalCount} منتج</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Load More Button or Finished State */}
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white border border-black/15 hover:border-brand text-foreground hover:text-brand font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-brand" />
                <span>جاري تحميل المنتجات...</span>
              </>
            ) : (
              <>
                <ArrowDownCircle size={18} className="text-brand transition-transform group-hover:translate-y-0.5" />
                <span>إظهار المزيد من المنتجات</span>
              </>
            )}
          </button>
        ) : (
          totalCount > pageSize && (
            <div className="flex items-center gap-2 text-foreground/50 text-xs font-medium py-3 px-5 bg-black/[0.02] rounded-full border border-black/5">
              <CheckCircle2 size={15} className="text-brand" />
              <span>لقد شاهدت جميع المنتجات المتاحة</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
