'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Edit, ExternalLink } from 'lucide-react'
import DeleteButton from './DeleteButton'
import SubCategoryAssignButton from './SubCategoryAssignButton'

type ProductRow = {
  id: string
  name: string
  slug: string
  brand: string | null
  price: any
  stock: number
  isActive: boolean
  imageUrl: string | null
  collection?: { id: string; name: string } | null
  subCategory?: { id: string; name: string } | null
}

type Props = {
  products: ProductRow[]
  subCategories: { id: string; name: string; collectionId: string }[]
}

export default function ProductsTableClient({ products, subCategories }: Props) {
  // Track expanded rows on mobile
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (products.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500 bg-white">
        لا توجد منتجات مطابقة لهذا الفلتر أو لم يتم إضافة منتجات بعد.
      </div>
    )
  }

  return (
    <>
      {/* ============================================================ */}
      {/* 1. Mobile View (< md): 3 Compact Columns + Accordion Details */}
      {/* ============================================================ */}
      <div className="md:hidden divide-y divide-gray-200 bg-white">
        {products.map((product) => {
          const isExpanded = !!expandedIds[product.id]

          return (
            <div key={product.id} className="transition-colors">
              {/* Main Compact Row: [Image] [Name + Slug] [SubCategory] [Expand Chevron] */}
              <div 
                onClick={() => toggleExpand(product.id)}
                className="p-3 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100 select-none"
              >
                {/* 1. Product Image */}
                <div className="shrink-0">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      width={44} 
                      height={44} 
                      className="w-11 h-11 object-cover rounded-lg border border-gray-200" 
                    />
                  ) : (
                    <div className="w-11 h-11 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      بدون
                    </div>
                  )}
                </div>

                {/* 2. Product Name */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {product.name}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5 truncate" dir="ltr">
                    /{product.slug}
                  </div>
                </div>

                {/* 3. SubCategory Button (stops propagation so clicking it opens the modal directly) */}
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <SubCategoryAssignButton
                    productId={product.id}
                    productName={product.name}
                    collection={product.collection}
                    currentSubCategory={product.subCategory}
                    availableSubCategories={subCategories}
                  />
                </div>

                {/* 4. Dropdown Indicator Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(product.id)
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors shrink-0"
                  title="عرض التفاصيل والإجراءات"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expandable Accordion Card: Actions, Price, Stock, Status */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-2.5 animate-in fade-in duration-200">
                  {/* Row 1: Price, Stock, Status, Collection */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-[10px] font-bold">السعر:</span>
                      <span className="font-black text-gray-900" dir="ltr">
                        {Number(product.price).toFixed(2)} ر.ي
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-[10px] font-bold">المخزون:</span>
                      <span className={`font-bold ${product.stock <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
                        {product.stock} قطع
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-[10px] font-bold">الحالة:</span>
                      <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full mt-0.5 ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'فعال' : 'غير فعال'}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block text-[10px] font-bold">المجموعة:</span>
                      <span className="font-bold text-gray-800 truncate block">
                        {product.collection?.name || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Official Actions Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-700">الإجراءات:</span>
                    <div className="flex items-center gap-1.5">
                      <Link 
                        href={`/admin/products/${product.id}/edit`} 
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        title="تعديل المنتج"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </Link>

                      <Link 
                        href={`/products/${product.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        title="معاينة في المتجر"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </Link>

                      <div className="inline-flex items-center">
                        <DeleteButton id={product.id} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* 2. Desktop View (>= md): Full Standard Table                 */}
      {/* ============================================================ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الصورة
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم المنتج
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المجموعة الفرعية
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                السعر
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المخزون
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المجموعة
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الماركة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      width={40} 
                      height={40} 
                      className="w-10 h-10 object-cover rounded-md border border-gray-200" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      بدون
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5 line-clamp-1" dir="ltr">/{product.slug}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <SubCategoryAssignButton
                    productId={product.id}
                    productName={product.name}
                    collection={product.collection}
                    currentSubCategory={product.subCategory}
                    availableSubCategories={subCategories}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <Link 
                      href={`/admin/products/${product.id}/edit`} 
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="تعديل المنتج"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteButton id={product.id} />
                    <Link 
                      href={`/products/${product.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      title="معاينة في المتجر"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold" dir="ltr">
                  {Number(product.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  <span className={`font-semibold ${product.stock <= 3 ? 'text-red-600 font-bold' : ''}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'فعال' : 'غير فعال'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                  {product.collection?.name ? (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                      {product.collection.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {product.brand || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
