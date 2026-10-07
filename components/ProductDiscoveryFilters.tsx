'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter, ChevronDown, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductDiscoveryFilters({ 
  totalProducts, 
  availableBrands 
}: { 
  totalProducts: number,
  availableBrands: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const [localPrice, setLocalPrice] = useState({ min: '', max: '' })
  const [localBrand, setLocalBrand] = useState<string[]>([])

  const currentSort = searchParams.get('sort') || 'newest'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const brandParam = searchParams.get('brand') || ''
  const currentBrands = brandParam ? brandParam.split(',') : []

  useEffect(() => {
    if (isFilterOpen) {
      setLocalPrice({ min: minPrice, max: maxPrice })
      setLocalBrand(currentBrands)
    }
  }, [isFilterOpen])

  const handleSort = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortValue)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsSortOpen(false)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (localPrice.min) params.set('minPrice', localPrice.min)
    else params.delete('minPrice')
    
    if (localPrice.max) params.set('maxPrice', localPrice.max)
    else params.delete('maxPrice')

    if (localBrand.length > 0) params.set('brand', localBrand.join(','))
    else params.delete('brand')

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsFilterOpen(false)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('brand')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsFilterOpen(false)
  }

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'brand' && value) {
      const newBrands = currentBrands.filter(b => b !== value)
      if (newBrands.length > 0) params.set('brand', newBrands.join(','))
      else params.delete('brand')
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <div className="flex flex-col mb-4 md:mb-6">
        <div className="flex items-center justify-between px-4 md:px-12 py-3 bg-white border-b border-black/5 text-sm">
          <div className="text-black/60 font-medium">{totalProducts} منتج</div>
          <div className="flex items-center gap-4">
            
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 font-medium hover:text-brand transition-colors"
              >
                <span>ترتيب</span>
                <ChevronDown size={14} className={isSortOpen ? 'rotate-180' : ''} />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {[
                      { val: 'newest', label: 'الأحدث' },
                      { val: 'price_asc', label: 'السعر: من الأقل' },
                      { val: 'price_desc', label: 'السعر: من الأعلى' },
                      { val: 'featured', label: 'الأكثر صلة' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => handleSort(opt.val)}
                        className={`w-full text-right px-4 py-3 text-sm hover:bg-black/5 flex items-center justify-between ${currentSort === opt.val ? 'text-brand font-bold bg-brand/5' : ''}`}
                      >
                        {opt.label}
                        {currentSort === opt.val && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-4 bg-black/10"></div>
            
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1.5 font-medium hover:text-brand transition-colors"
            >
              <span>الفلاتر</span>
              <Filter size={14} />
              {(minPrice || maxPrice || currentBrands.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-brand"></span>
              )}
            </button>
          </div>
        </div>

        {(minPrice || maxPrice || currentBrands.length > 0) && (
          <div className="px-4 md:px-12 py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-black/50 ml-2">الفلاتر النشطة:</span>
            
            {minPrice && (
              <span className="inline-flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full border border-brand/20">
                من {minPrice}
                <button onClick={() => removeFilter('minPrice')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
            
            {maxPrice && (
              <span className="inline-flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full border border-brand/20">
                حتى {maxPrice}
                <button onClick={() => removeFilter('maxPrice')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}

            {currentBrands.map(b => (
              <span key={b} className="inline-flex items-center gap-1 bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full border border-brand/20">
                {b}
                <button onClick={() => removeFilter('brand', b)} className="hover:text-red-500"><X size={12} /></button>
              </span>
            ))}

            <button onClick={clearAllFilters} className="text-xs text-red-500 underline hover:text-red-600 mr-2">
              مسح الكل
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col z-10"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/10 bg-white">
                <h3 className="text-lg font-bold">الفلاتر</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-8">
                <div>
                  <h4 className="font-bold text-sm mb-4">نطاق السعر</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-black/50 mb-1 block">من</label>
                      <input 
                        type="number" 
                        value={localPrice.min}
                        onChange={e => setLocalPrice({ ...localPrice, min: e.target.value })}
                        placeholder="0"
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-black/50 mb-1 block">إلى</label>
                      <input 
                        type="number" 
                        value={localPrice.max}
                        onChange={e => setLocalPrice({ ...localPrice, max: e.target.value })}
                        placeholder="الحد الأقصى"
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {availableBrands.length > 0 && (
                  <div>
                    <h4 className="font-bold text-sm mb-4">الماركة</h4>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {availableBrands.map(brand => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={localBrand.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) setLocalBrand([...localBrand, brand])
                              else setLocalBrand(localBrand.filter(b => b !== brand))
                            }}
                            className="w-4 h-4 rounded border-black/20 text-brand focus:ring-brand accent-brand cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-brand transition-colors">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-black/10 bg-white grid grid-cols-2 gap-3">
                <button 
                  onClick={clearAllFilters}
                  className="w-full py-3 border border-black/10 text-foreground font-bold rounded-xl hover:bg-black/5 transition-colors"
                >
                  مسح الكل
                </button>
                <button 
                  onClick={applyFilters}
                  className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover transition-colors"
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
