'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

interface CollectionOption {
  id: string
  name: string
}

interface SubCategoryOption {
  id: string
  name: string
  collectionId: string
}

export default function CollectionFilter({
  collections,
  subCategories = [],
  selectedCollectionId,
  selectedSubCategoryId,
}: {
  collections: CollectionOption[]
  subCategories?: SubCategoryOption[]
  selectedCollectionId?: string
  selectedSubCategoryId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter subcategories that belong to currently selected collection
  const availableSubCategories = selectedCollectionId 
    ? subCategories.filter(sub => sub.collectionId === selectedCollectionId)
    : []

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('collectionId', value)
    } else {
      params.delete('collectionId')
    }
    // Reset subCategory and page whenever main collection changes
    params.delete('subCategoryId')
    params.delete('page')
    
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('subCategoryId', value)
    } else {
      params.delete('subCategoryId')
    }
    params.delete('page')

    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('collectionId')
    params.delete('subCategoryId')
    params.delete('page')
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* المستوى الأول: المجموعة الرئيسية */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm">
        <Filter className="w-4 h-4 text-gray-500" />
        <label htmlFor="collection-filter" className="text-xs font-bold text-gray-700 whitespace-nowrap">
          المجموعة:
        </label>
        <select
          id="collection-filter"
          value={selectedCollectionId || ''}
          onChange={handleCollectionChange}
          className="text-xs font-medium text-gray-900 bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
        >
          <option value="">جميع المجموعات</option>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      {/* المستوى الثاني: الفرع / المجموعة الفرعية (يظهر عند تحديد مجموعة رئيسية لها فروع) */}
      {selectedCollectionId && availableSubCategories.length > 0 && (
        <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-1.5 shadow-sm animate-fadeIn">
          <label htmlFor="subcategory-filter" className="text-xs font-bold text-amber-800 whitespace-nowrap">
            الفرع:
          </label>
          <select
            id="subcategory-filter"
            value={selectedSubCategoryId || ''}
            onChange={handleSubCategoryChange}
            className="text-xs font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="">كل الفروع</option>
            {availableSubCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(selectedCollectionId || selectedSubCategoryId) && (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
          title="إلغاء التصفية وعرض الكل"
        >
          <X className="w-3.5 h-3.5" />
          إلغاء الفلترة
        </button>
      )}
    </div>
  )
}
