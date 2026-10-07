'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export default function PaginationControls({ currentPage, totalPages }: { currentPage: number, totalPages: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const handlePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-8 text-sm" dir="rtl">
      <button 
        disabled={currentPage === 1}
        onClick={() => handlePage(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
      
      {pages.map(p => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors ${
            currentPage === p 
              ? 'bg-brand text-white border-brand' 
              : 'bg-white text-foreground hover:bg-black/5 border border-black/10'
          }`}
        >
          {p}
        </button>
      ))}

      <button 
        disabled={currentPage === totalPages}
        onClick={() => handlePage(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  )
}
