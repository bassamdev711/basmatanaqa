'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Filter, 
  ChevronDown, 
  X, 
  Check, 
  Coins, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Tag, 
  Search,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CollectionOption {
  name: string
  slug: string
}

interface SubCategoryOption {
  name: string
  slug: string
  collectionSlug: string
}

interface ProductDiscoveryFiltersProps {
  totalProducts: number
  availableBrands: string[]
  collections?: CollectionOption[]
  subCategories?: SubCategoryOption[]
  currency?: string
}

export default function ProductDiscoveryFilters({ 
  totalProducts, 
  availableBrands,
  collections = [],
  subCategories = [],
  currency = 'ر.س'
}: ProductDiscoveryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Modal States
  const [isBudgetOpen, setIsBudgetOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Traditional filter state
  const [localPrice, setLocalPrice] = useState({ min: '', max: '' })
  const [localBrand, setLocalBrand] = useState<string[]>([])

  // Budget Wizard State
  const [budgetStep, setBudgetStep] = useState<1 | 2 | 3>(1)
  const [wizardBudget, setWizardBudget] = useState('')
  const [wizardCollection, setWizardCollection] = useState<'all' | string>('all')
  const [wizardSubCategory, setWizardSubCategory] = useState<'all' | string>('all')

  const currentSort = searchParams.get('sort') || 'newest'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const brandParam = searchParams.get('brand') || ''
  const currentBrands = brandParam ? brandParam.split(',') : []
  const currentCollection = searchParams.get('collection') || ''
  const currentSubCategory = searchParams.get('subcategory') || ''

  // Sync state on open
  useEffect(() => {
    if (isFilterOpen) {
      setLocalPrice({ min: minPrice, max: maxPrice })
      setLocalBrand(currentBrands)
    }
  }, [isFilterOpen, minPrice, maxPrice, brandParam])

  useEffect(() => {
    if (isBudgetOpen) {
      setBudgetStep(1)
      setWizardBudget(maxPrice || '')
      setWizardCollection(currentCollection || 'all')
      setWizardSubCategory(currentSubCategory || 'all')
    }
  }, [isBudgetOpen, maxPrice, currentCollection, currentSubCategory])

  // Get matching subcategories for currently chosen collection
  const availableSubCategoriesForCollection = wizardCollection !== 'all' 
    ? subCategories.filter(s => s.collectionSlug === wizardCollection)
    : []

  const handleSort = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortValue)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsSortOpen(false)
  }

  // Traditional filters application
  const applyTraditionalFilters = () => {
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

  // Budget Wizard Application
  const applyBudgetWizard = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (wizardBudget && parseFloat(wizardBudget) > 0) {
      params.set('maxPrice', wizardBudget)
    } else {
      params.delete('maxPrice')
    }

    if (wizardCollection && wizardCollection !== 'all') {
      params.set('collection', wizardCollection)
    } else {
      params.delete('collection')
    }

    if (wizardSubCategory && wizardSubCategory !== 'all') {
      params.set('subcategory', wizardSubCategory)
    } else {
      params.delete('subcategory')
    }

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsBudgetOpen(false)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('brand')
    params.delete('collection')
    params.delete('subcategory')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsFilterOpen(false)
    setIsBudgetOpen(false)
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

  const handleSelectCollection = (colSlug: string) => {
    setWizardCollection(colSlug)
    setWizardSubCategory('all')
    
    if (colSlug === 'all') {
      // If "All", no subcategories exist
      setBudgetStep(2)
      return
    }

    const subCats = subCategories.filter(s => s.collectionSlug === colSlug)
    if (subCats.length > 0) {
      setBudgetStep(3)
    } else {
      // No subcategories, stay on step 2 ready to submit
      setBudgetStep(2)
    }
  }

  return (
    <>
      <div className="flex flex-col mb-4 md:mb-6" dir="rtl">
        {/* Top Discovery Bar */}
        <div className="flex items-center justify-between px-4 md:px-12 py-3 bg-white border-b border-black/5 text-sm">
          <div className="text-black/60 font-medium">{totalProducts} منتج</div>

          <div className="flex items-center gap-3">
            {/* 1. زر الميزانية الفخم */}
            <button 
              onClick={() => setIsBudgetOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/5 hover:bg-brand/10 text-brand font-medium transition-all duration-300 border border-brand/20 shadow-xs hover:shadow-sm"
              title="تسوّق حسب ميزانيتك"
            >
              <Coins size={15} className="text-brand shrink-0" />
              <span className="font-semibold text-xs md:text-sm">الميزانية</span>
              {maxPrice && (
                <span className="bg-brand text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  حتى {maxPrice} {currency}
                </span>
              )}
            </button>

            <div className="w-px h-4 bg-black/10"></div>

            {/* 2. زر الترتيب */}
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 font-medium hover:text-brand transition-colors text-xs md:text-sm text-foreground/80"
              >
                <span>ترتيب</span>
                <ChevronDown size={14} className={isSortOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/10 rounded-2xl shadow-xl z-50 overflow-hidden"
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
                        className={`w-full text-right px-4 py-2.5 text-xs md:text-sm hover:bg-black/5 flex items-center justify-between ${currentSort === opt.val ? 'text-brand font-bold bg-brand/5' : ''}`}
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
            
            {/* 3. زر الفلاتر العامة (الماركات وغيرها) */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1.5 font-medium hover:text-brand transition-colors text-xs md:text-sm text-foreground/80"
            >
              <span>الفلاتر</span>
              <Filter size={14} />
              {(minPrice || currentBrands.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-brand"></span>
              )}
            </button>
          </div>
        </div>

        {/* شريط الفلاتر النشطة */}
        {(minPrice || maxPrice || currentBrands.length > 0 || currentCollection || currentSubCategory) && (
          <div className="px-4 md:px-12 py-2.5 flex items-center gap-2 flex-wrap bg-surface-alt/40 border-b border-black/5 text-xs">
            <span className="text-black/50 ml-1 font-medium">الفلاتر المطبقة:</span>
            
            {maxPrice && (
              <span className="inline-flex items-center gap-1.5 bg-brand/10 text-brand font-bold px-3 py-1 rounded-full border border-brand/20">
                <Coins size={12} />
                <span>الميزانية: حتى {maxPrice} {currency}</span>
                <button onClick={() => removeFilter('maxPrice')} className="hover:text-red-500 transition-colors mr-0.5">
                  <X size={12} />
                </button>
              </span>
            )}

            {minPrice && (
              <span className="inline-flex items-center gap-1.5 bg-black/5 text-foreground/80 font-medium px-3 py-1 rounded-full border border-black/10">
                <span>من {minPrice} {currency}</span>
                <button onClick={() => removeFilter('minPrice')} className="hover:text-red-500 transition-colors mr-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {currentBrands.map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 bg-brand/10 text-brand font-bold px-3 py-1 rounded-full border border-brand/20">
                <span>{b}</span>
                <button onClick={() => removeFilter('brand', b)} className="hover:text-red-500 transition-colors mr-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}

            <button 
              onClick={clearAllFilters} 
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium mr-2 hover:underline"
            >
              <RotateCcw size={11} />
              <span>إعادة ضبط</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── النافذة التفاعلية للميزانية (Budget Wizard Modal) ─── */}
      <AnimatePresence>
        {isBudgetOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
            {/* الخلفية المظللة */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsBudgetOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            {/* بطاقة الميزانية الفخمة اللطيفة */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-surface border border-brand/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* الرأس الفخم */}
              <div className="px-6 py-5 border-b border-black/8 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                    <Coins size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground">تسوّق بميزانيتك</h3>
                    <p className="text-xs text-foreground/50">حدّد ميزانيتك لنقترح لك أنسب الخيارات</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsBudgetOpen(false)} 
                  className="p-2 text-foreground/50 hover:text-foreground hover:bg-black/5 rounded-full transition-colors"
                  aria-label="إغلاق"
                >
                  <X size={18} />
                </button>
              </div>

              {/* شريط مؤشر الخطوات الأنيق */}
              <div className="px-6 py-3 bg-white/60 border-b border-black/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-colors ${budgetStep === 1 ? 'bg-brand text-white' : 'bg-brand/15 text-brand'}`}>
                    1
                  </span>
                  <span className={`font-semibold ${budgetStep === 1 ? 'text-brand' : 'text-foreground/60'}`}>الميزانية</span>
                </div>

                <div className="w-8 h-px bg-black/10"></div>

                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-colors ${budgetStep === 2 ? 'bg-brand text-white' : budgetStep > 2 ? 'bg-brand/15 text-brand' : 'bg-black/10 text-foreground/40'}`}>
                    2
                  </span>
                  <span className={`font-semibold ${budgetStep === 2 ? 'text-brand' : budgetStep > 2 ? 'text-foreground/70' : 'text-foreground/40'}`}>القسم</span>
                </div>

                {availableSubCategoriesForCollection.length > 0 && (
                  <>
                    <div className="w-8 h-px bg-black/10"></div>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-colors ${budgetStep === 3 ? 'bg-brand text-white' : 'bg-black/10 text-foreground/40'}`}>
                        3
                      </span>
                      <span className={`font-semibold ${budgetStep === 3 ? 'text-brand' : 'text-foreground/40'}`}>النوع</span>
                    </div>
                  </>
                )}
              </div>

              {/* المحتوى حسب الخطوة */}
              <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6 custom-scrollbar">
                {/* ── الخطوة 1: تحديد الميزانية ── */}
                {budgetStep === 1 && (
                  <div className="flex flex-col gap-6">
                    <div className="text-center">
                      <h4 className="text-base font-bold text-foreground mb-1">كم الحد الأقصى لميزانيتك؟</h4>
                      <p className="text-xs text-foreground/60">أدخل المبلغ وسنعرض لك المنتجات التي تناسب ميزانيتك أو تقل عنها</p>
                    </div>

                    {/* حقل الإدخال الرئيسي الفخم */}
                    <div className="relative">
                      <input 
                        type="number" 
                        value={wizardBudget}
                        onChange={e => setWizardBudget(e.target.value)}
                        placeholder="أدخل المبلغ هنا..."
                        className="w-full text-center text-2xl font-bold bg-white border-2 border-brand/25 focus:border-brand rounded-2xl px-14 py-4 text-foreground focus:outline-none shadow-xs transition-all placeholder:text-foreground/25"
                      />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand bg-brand/10 px-3 py-1 rounded-xl">
                        {currency}
                      </span>
                    </div>

                    {/* أزرار التسريع الرسمية بدون أي إيموجيز */}
                    <div>
                      <div className="text-xs font-semibold text-foreground/60 mb-2.5 text-center">أزرار تسريع مقترحة</div>
                      <div className="grid grid-cols-3 gap-3">
                        {['1000', '2500', '3000'].map(val => {
                          const isSelected = wizardBudget === val
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setWizardBudget(val)}
                              className={`py-3 px-2 rounded-2xl border font-bold text-sm transition-all duration-200 flex flex-col items-center justify-center gap-1 shadow-xs ${
                                isSelected 
                                  ? 'bg-brand text-white border-brand shadow-md scale-[1.02]' 
                                  : 'bg-white hover:bg-brand/5 border-black/10 text-foreground hover:border-brand/40'
                              }`}
                            >
                              <span className="text-base tracking-wider">{val}</span>
                              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-foreground/50'}`}>
                                {currency}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── الخطوة 2: اختيار القسم ── */}
                {budgetStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <h4 className="text-base font-bold text-foreground mb-1">اختر القسم المراد</h4>
                      <p className="text-xs text-foreground/60">يمكنك استعراض كل الأقسام أو تحديد قسم محدد</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {/* خيار جميع الأقسام الرسمي */}
                      <button
                        type="button"
                        onClick={() => handleSelectCollection('all')}
                        className={`p-4 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between ${
                          wizardCollection === 'all'
                            ? 'bg-brand text-white border-brand shadow-md font-bold'
                            : 'bg-white hover:bg-brand/5 border-black/10 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers size={18} className={wizardCollection === 'all' ? 'text-white' : 'text-brand'} />
                          <span className="text-sm font-semibold">جميع الأقسام</span>
                        </div>
                        {wizardCollection === 'all' && <Check size={16} />}
                      </button>

                      {/* قائمة الأقسام من المتجر */}
                      {collections.map(col => {
                        const isSelected = wizardCollection === col.slug
                        return (
                          <button
                            key={col.slug}
                            type="button"
                            onClick={() => handleSelectCollection(col.slug)}
                            className={`p-4 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-md font-bold'
                                : 'bg-white hover:bg-brand/5 border-black/10 text-foreground'
                            }`}
                          >
                            <span className="text-sm font-medium">{col.name}</span>
                            {isSelected && <Check size={16} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── الخطوة 3: اختيار التصنيف الفرعي (إذا وُجد) ── */}
                {budgetStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <h4 className="text-base font-bold text-foreground mb-1">حدّد النوع بالتحديد</h4>
                      <p className="text-xs text-foreground/60">
                        {collections.find(c => c.slug === wizardCollection)?.name || 'القسم المختار'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {/* الكل في هذا القسم */}
                      <button
                        type="button"
                        onClick={() => setWizardSubCategory('all')}
                        className={`p-4 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between ${
                          wizardSubCategory === 'all'
                            ? 'bg-brand text-white border-brand shadow-md font-bold'
                            : 'bg-white hover:bg-brand/5 border-black/10 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Tag size={16} className={wizardSubCategory === 'all' ? 'text-white' : 'text-brand'} />
                          <span className="text-sm font-semibold">الكل في هذا القسم</span>
                        </div>
                        {wizardSubCategory === 'all' && <Check size={16} />}
                      </button>

                      {/* التصنيفات الفرعية الخاصة بالقسم المختار */}
                      {availableSubCategoriesForCollection.map(sub => {
                        const isSelected = wizardSubCategory === sub.slug
                        return (
                          <button
                            key={sub.slug}
                            type="button"
                            onClick={() => setWizardSubCategory(sub.slug)}
                            className={`p-4 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-md font-bold'
                                : 'bg-white hover:bg-brand/5 border-black/10 text-foreground'
                            }`}
                          >
                            <span className="text-sm font-medium">{sub.name}</span>
                            {isSelected && <Check size={16} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* الشريط السفلي الفخم (Action Bar) */}
              <div className="p-5 border-t border-black/8 bg-white flex items-center gap-3">
                {/* زر الرجوع */}
                {budgetStep > 1 && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (budgetStep === 3) setBudgetStep(2)
                      else if (budgetStep === 2) setBudgetStep(1)
                    }}
                    className="py-3 px-4 rounded-2xl border border-black/10 hover:bg-black/5 text-foreground font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowRight size={15} />
                    <span>السابق</span>
                  </button>
                )}

                {/* زر المتابعة في الخطوة 1 */}
                {budgetStep === 1 ? (
                  <button 
                    type="button"
                    onClick={() => setBudgetStep(2)}
                    disabled={!wizardBudget || parseFloat(wizardBudget) <= 0}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>متابعة لاختيار القسم</span>
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  /* الزر النهائي الفخم كما طُلب تماماً: «المنتجات المناسبة لميزانيتي» */
                  <button 
                    type="button"
                    onClick={applyBudgetWizard}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Search size={16} />
                    <span>المنتجات المناسبة لميزانيتي</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── الفلتر التقليدي الإضافي (للماركات وغيرها) ─── */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/10 bg-white">
                <h3 className="text-base font-bold">فلاتر إضافية</h3>
                <button 
                  onClick={() => setIsFilterOpen(false)} 
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
                {/* الحد الأدنى للسعر */}
                <div>
                  <h4 className="font-bold text-xs text-foreground/70 mb-3">الحد الأدنى للسعر</h4>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={localPrice.min}
                      onChange={e => setLocalPrice({ ...localPrice, min: e.target.value })}
                      placeholder="0"
                      className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40 font-bold">
                      {currency}
                    </span>
                  </div>
                </div>

                {/* تصفية الماركات */}
                {availableBrands.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-foreground/70 mb-3">الماركة</h4>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {availableBrands.map(brand => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group py-1">
                          <input 
                            type="checkbox"
                            checked={localBrand.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) setLocalBrand([...localBrand, brand])
                              else setLocalBrand(localBrand.filter(b => b !== brand))
                            }}
                            className="w-4 h-4 rounded border-black/20 text-brand focus:ring-brand accent-brand cursor-pointer"
                          />
                          <span className="text-xs group-hover:text-brand transition-colors font-medium">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-black/10 bg-white grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setLocalPrice({ min: '', max: '' })
                    setLocalBrand([])
                  }}
                  className="w-full py-3 border border-black/10 text-foreground font-semibold rounded-xl hover:bg-black/5 transition-colors text-xs"
                >
                  مسح
                </button>
                <button 
                  onClick={applyTraditionalFilters}
                  className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover transition-colors text-xs shadow-xs"
                >
                  تطبيق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
