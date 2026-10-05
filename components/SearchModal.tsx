'use client'

import { startTransition, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Loader2, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrency } from '@/components/CurrencyProvider'

type SearchProduct = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  price: number
  compareAtPrice: number | null
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const currency = useCurrency()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      startTransition(() => {
        setQuery('')
        setResults([])
      })
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.products || [])
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[101] bg-surface shadow-2xl rounded-b-3xl overflow-hidden"
            dir="rtl"
          >
            <div className="max-w-4xl mx-auto p-3 md:p-8">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-4 md:mb-8">
                <Search className="absolute right-4 text-foreground/50 w-6 h-6" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن منتج، تصنيف، أو كلمة مفتاحية..."
                  className="w-full bg-white border-2 border-brand/20 rounded-full py-3 md:py-4 pr-12 md:pr-14 pl-12 md:pl-14 text-base md:text-lg text-foreground focus:outline-none focus:border-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute left-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </form>

              <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 text-brand">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm font-bold animate-pulse">جاري البحث...</p>
                  </div>
                ) : query && results.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold text-foreground/50 mb-4 px-2">النتائج السريعة</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-2 md:p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-black/5 group"
                        >
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-lg border border-black/5 flex items-center justify-center relative overflow-hidden shrink-0">
                            {product.imageUrl ? (
                              <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <span className="text-accent">متجرنا</span>
                            )}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-foreground text-sm line-clamp-1">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-brand font-bold text-sm">{Number(product.price).toLocaleString('ar-SA')} {currency}</span>
                              {product.compareAtPrice && (
                                <span className="text-foreground/40 line-through text-xs">
                                  {Number(product.compareAtPrice).toLocaleString('ar-SA')} {currency}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-foreground/20 group-hover:text-brand transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                    {results.length === 8 && (
                      <div className="mt-6 text-center">
                        <button type="submit" onClick={handleSearchSubmit} className="text-brand font-bold hover:underline inline-flex items-center gap-1">
                          عرض جميع النتائج لـ &quot;{query}&quot; <ArrowLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <p className="text-lg font-bold text-foreground mb-2">لم نجد نتائج مطابقة لـ &quot;{query}&quot;</p>
                    <p className="text-sm text-foreground/60">حاول استخدام كلمات مختلفة أو تصفح مجموعاتنا.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-2 opacity-60">
                    <div>
                      <h3 className="text-sm font-bold text-foreground/70 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        عمليات بحث شائعة
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {['الأكثر مبيعًا', 'وصل حديثًا', 'هدايا', 'عروض', 'منتجات مميزة'].map((term) => (
                          <button 
                            key={term}
                            onClick={() => setQuery(term)}
                            className="px-4 py-2 bg-white rounded-full text-sm font-medium hover:bg-brand hover:text-white transition-colors border border-black/5"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
