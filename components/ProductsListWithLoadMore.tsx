'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'
import { Loader2, ArrowDownCircle, CheckCircle2 } from 'lucide-react'

export interface ProductItemData {
  id: string
  slug: string
  name: string
  brand?: string | null
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
  const [products, setProducts] = useState<ProductItemData[]>(initialProducts)
  const [page, setPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [, startTransition] = useTransition()

  // Reset products when filters/search params change (excluding page if any)
  const filterKey = searchParams.toString()

  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
  }, [filterKey, initialProducts])

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
            // Avoid duplicate IDs if already present
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
              price: product.price,
              compareAtPrice: product.compareAtPrice ?? null,
              imageUrl: product.imageUrl,
              brand: product.brand || undefined,
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
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white border border-black/15 hover:border-brand text-foreground hover:text-brand font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
