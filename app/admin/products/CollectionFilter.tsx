'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

interface CollectionOption {
  id: string
  name: string
}

export default function CollectionFilter({
  collections,
  selectedCollectionId,
}: {
  collections: CollectionOption[]
  selectedCollectionId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('collectionId', value)
      params.delete('page')
    } else {
      params.delete('collectionId')
      params.delete('page')
    }
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('collectionId')
    params.delete('page')
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : '/admin/products')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm">
        <Filter className="w-4 h-4 text-gray-500" />
        <label htmlFor="collection-filter" className="text-xs font-bold text-gray-700 whitespace-nowrap">
          المجموعة:
        </label>
        <select
          id="collection-filter"
          value={selectedCollectionId || ''}
          onChange={handleSelectChange}
          className="text-xs font-medium text-gray-900 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">جميع المجموعات</option>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCollectionId && (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
          title="عرض جميع المجموعات"
        >
          <X className="w-3.5 h-3.5" />
          إلغاء الفلترة
        </button>
      )}
    </div>
  )
}
