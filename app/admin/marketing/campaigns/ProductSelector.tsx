'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'

type Product = {
  id: string
  name: string
  imageUrl: string | null
}

export default function ProductSelector({
  products,
  selectedProductIds = []
}: {
  products: Product[]
  selectedProductIds?: string[]
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن منتج بالاسم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 text-sm focus:outline-none focus:border-emerald bg-white"
        />
      </div>

      {/* Product List */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
        {products.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">لا توجد منتجات نشطة في المتجر</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">لا توجد منتجات مطابقة لبحثك</p>
        ) : (
          filteredProducts.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input 
                type="checkbox" 
                name="productIds" 
                value={p.id} 
                defaultChecked={selectedProductIds.includes(p.id)}
                className="w-4 h-4 rounded accent-emerald" 
              />
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} width={32} height={32} className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xs text-gray-400">صورة</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{p.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
