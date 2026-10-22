'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronRight, Home } from 'lucide-react'

interface ProductBackHeaderProps {
  productName: string
  collection?: { name: string; slug: string } | null
  subCategory?: { name: string; slug: string } | null
}

export default function ProductBackHeader({
  productName,
  collection,
  subCategory,
}: ProductBackHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const lastPath = sessionStorage.getItem('basmatanaqa_last_path')
      if (lastPath) {
        router.push(lastPath)
        return
      }
      if (window.history.length > 1) {
        router.back()
        return
      }
    }

    if (collection?.slug) {
      router.push(`/products?collection=${collection.slug}`)
    } else {
      router.push('/products')
    }
  }

  return (
    <div className="pt-20 lg:pt-24 pb-3 px-4 md:px-6" dir="rtl">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        {/* 1. Back Button (Smart return to previous spot) */}
        <button
          onClick={handleBack}
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/10 hover:border-brand text-foreground/80 hover:text-brand text-xs font-bold transition-all shadow-sm active:scale-95 group cursor-pointer"
          title="العودة للصفحة السابقة"
        >
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform text-brand" />
          <span>رجوع</span>
        </button>

        {/* 2. Dynamic Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-foreground/60 font-medium overflow-x-auto no-scrollbar py-1">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-brand transition-colors shrink-0"
            title="الرئيسية"
          >
            <Home size={13} className="opacity-70" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Link>

          <ChevronRight className="w-3 h-3 rotate-180 text-foreground/30 shrink-0" />

          {collection ? (
            <Link
              href={`/products?collection=${collection.slug}`}
              className="hover:text-brand transition-colors shrink-0 font-semibold"
            >
              {collection.name}
            </Link>
          ) : (
            <Link
              href="/products"
              className="hover:text-brand transition-colors shrink-0 font-semibold"
            >
              المجموعة
            </Link>
          )}

          {subCategory && (
            <>
              <ChevronRight className="w-3 h-3 rotate-180 text-foreground/30 shrink-0" />
              <Link
                href={
                  collection?.slug
                    ? `/products?collection=${collection.slug}&subcategory=${subCategory.slug}`
                    : `/products?subcategory=${subCategory.slug}`
                }
                className="hover:text-brand transition-colors shrink-0"
              >
                {subCategory.name}
              </Link>
            </>
          )}

          <ChevronRight className="w-3 h-3 rotate-180 text-foreground/30 shrink-0" />

          <span className="text-brand font-bold truncate max-w-[150px] sm:max-w-xs shrink-0">
            {productName}
          </span>
        </nav>
      </div>
    </div>
  )
}
