'use client'

import React, { useState } from 'react'
import { Shirt, Baby, Footprints, ChevronDown, ChevronUp, Check, Plus, X, Layers, Trash2 } from 'lucide-react'

interface SizeSelectorProps {
  hasSizes: boolean
  onHasSizesChange: (hasSizes: boolean) => void
  availableSizes: string[]
  onChangeSizes: (sizes: string[]) => void
}

interface PresetCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  badgeText: string
  description: string
  sizes: string[]
}

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'adults',
    name: 'ملابس كبار (أحجام قياسية)',
    icon: Shirt,
    badgeText: 'S - XL - XXL',
    description: 'مقاسات الملابس بالأحرف القياسية للكبار والشباب',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'مقاس موحد (Free Size)'],
  },
  {
    id: 'kids',
    name: 'ملابس أطفال (أعمار بالسنوات)',
    icon: Baby,
    badgeText: 'مواليد - 9 سنوات',
    description: 'مقاسات الأعمار للمواليد والأطفال والصغار',
    sizes: [
      'مواليد',
      'سنة',
      '2 سنة',
      '3 سنة',
      '4 سنة',
      '5 سنة',
      '6 سنة',
      '7 سنة',
      '8 سنة',
      '9 سنة',
      '10 سنة',
      '11 سنة',
      '12 سنة',
      '14 سنة',
    ],
  },
  {
    id: 'shoes',
    name: 'مقاسات الأحذية (أرقام)',
    icon: Footprints,
    badgeText: '21 إلى 40',
    description: 'مقاسات الأحذية للأطفال والنساء والرجال',
    sizes: Array.from({ length: 20 }, (_, i) => String(21 + i)), // 21 to 40
  },
]

export default function SizeSelector({
  hasSizes,
  onHasSizesChange,
  availableSizes,
  onChangeSizes,
}: SizeSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')

  const toggleSize = (size: string) => {
    const trimmed = size.trim()
    if (availableSizes.includes(trimmed)) {
      onChangeSizes(availableSizes.filter((s) => s !== trimmed))
    } else {
      onChangeSizes([...availableSizes, trimmed])
    }
  }

  const selectAllCategory = (sizes: string[]) => {
    const newSizesSet = new Set([...availableSizes, ...sizes])
    onChangeSizes(Array.from(newSizesSet))
  }

  const deselectAllCategory = (sizes: string[]) => {
    const toRemoveSet = new Set(sizes)
    onChangeSizes(availableSizes.filter((s) => !toRemoveSet.has(s)))
  }

  const handleAddCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && !availableSizes.includes(trimmed)) {
      onChangeSizes([...availableSizes, trimmed])
      setCustomInput('')
    }
  }

  const clearAllSizes = () => {
    onChangeSizes([])
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <label className="flex items-center gap-3 cursor-pointer mb-4 select-none">
        <input
          type="checkbox"
          checked={hasSizes}
          onChange={(e) => onHasSizesChange(e.target.checked)}
          className="h-5 w-5 rounded text-black focus:ring-black border-gray-300"
        />
        <div>
          <span className="text-base font-bold text-gray-900 block">المنتج يحتوي على مقاسات</span>
          <span className="text-xs text-gray-500">اختر من النماذج الجاهزة بنقرة واحدة (ملابس كبار، أطفال، أحذية) أو أضف مقاساً مخصصاً</span>
        </div>
      </label>

      {hasSizes && (
        <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-5 animate-in fade-in duration-200">
          
          {/* Header instructions */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Layers className="w-4 h-4 text-gray-600" />
              <span>نماذج المقاسات الجاهزة (انقر لاختيار الفئة):</span>
            </div>
            {availableSizes.length > 0 && (
              <button
                type="button"
                onClick={clearAllSizes}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح الكل ({availableSizes.length})
              </button>
            )}
          </div>

          {/* Hierarchical Category Accordions */}
          <div className="space-y-3">
            {PRESET_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isOpen = activeCategory === cat.id
              const selectedCount = cat.sizes.filter((s) => availableSizes.includes(s)).length

              return (
                <div
                  key={cat.id}
                  className={`border rounded-lg transition-all duration-200 bg-white overflow-hidden ${
                    isOpen ? 'border-black shadow-sm ring-1 ring-black/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Category Header Button */}
                  <button
                    type="button"
                    onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                    className="w-full p-3.5 flex items-center justify-between text-right hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{cat.name}</span>
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {cat.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-black text-white rounded-full">
                          {selectedCount} محدد
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Category Size Items (Expanded View) */}
                  {isOpen && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">
                          انقر على المقاس لإضافته أو حذفه بنقرة واحدة:
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllCategory(cat.sizes)}
                            className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                          >
                            تحديد كل الفئة
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => deselectAllCategory(cat.sizes)}
                            className="text-gray-500 hover:text-gray-700 font-bold hover:underline"
                          >
                            إلغاء الفئة
                          </button>
                        </div>
                      </div>

                      {/* Sizes Buttons Grid */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {cat.sizes.map((size) => {
                          const isSelected = availableSizes.includes(size)
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`px-3.5 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                isSelected
                                  ? 'bg-black text-white ring-2 ring-black ring-offset-1 scale-[1.02]'
                                  : 'bg-white text-gray-800 border border-gray-300 hover:border-black hover:bg-gray-100'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-gray-400" />
                              )}
                              <span>{size}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom Size Input */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              أو كتابة مقاس مخصص يدويًا:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustom()
                  }
                }}
                placeholder="مثال: 5XL، مقاس 43، تفصيل خاص..."
                className="flex-1 rounded-md border-gray-300 border p-2 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="btn btn-secondary px-4 text-sm font-bold disabled:opacity-50"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Selected Sizes Summary Pills */}
          {availableSizes.length > 0 ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  المقاسات المعتمدة للمنتج ({availableSizes.length} مقاس):
                </span>
                <span className="text-[11px] text-gray-500">
                  (انقر على × لحذف أي مقاس)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    <span>{size}</span>
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="hover:text-red-300 focus:outline-none p-0.5 rounded hover:bg-white/10 transition-colors"
                      title="إزالة المقاس"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
              ⚠️ لم تقم باختيار أي مقاس بعد. انقر على إحدى الفئات أعلاه وحدد المقاسات المطلوبة.
            </p>
          )}

        </div>
      )}
    </div>
  )
}
