'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { updatePurchaseTaskItemStatus } from '../actions'
import { useToast } from '@/components/ToastProvider'
import { Check, X, Clock, Edit2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

type TaskItem = {
  id: string
  status: string
  actualCost: number | null
  orderItem: {
    quantity: number
    selectedSize: string | null
    product: {
      name: string
      slug: string
      imageUrl: string | null
      costPrice: number | null
    } | null
  }
}

export default function PurchaseTaskItemsClient({ items }: { items: TaskItem[] }) {
  const { showToast } = useToast()
  const router = useRouter()
  
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [editCostValue, setEditCostValue] = useState<string>('')

  const handleStatusChange = async (itemId: string, status: string, cost?: number) => {
    setLoadingId(itemId)
    const res = await updatePurchaseTaskItemStatus(itemId, status, cost)
    setLoadingId(null)
    
    if (res.success) {
      showToast('success', 'تم تحديث حالة القطعة بنجاح')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleSaveCost = (itemId: string) => {
    const numCost = parseFloat(editCostValue)
    if (isNaN(numCost) || numCost < 0) {
      alert('الرجاء إدخال تكلفة صحيحة')
      return
    }
    handleStatusChange(itemId, items.find(i => i.id === itemId)?.status || 'PENDING', numCost)
    setEditingCostId(null)
  }

  return (
    <div className="space-y-6">
      {items.map(item => (
        <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50 items-start md:items-center justify-between">
          
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 bg-white border border-gray-200 rounded-md relative flex-shrink-0 flex items-center justify-center">
              {item.orderItem.product?.imageUrl ? (
                <Image src={item.orderItem.product.imageUrl} alt="" fill className="object-contain p-2 mix-blend-multiply" />
              ) : (
                <span className="text-gray-300 text-xs">لا توجد صورة</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{item.orderItem.product?.name || 'منتج محذوف'}</h3>
              <p className="text-sm text-gray-600 mb-1"><span className="font-bold">الكمية المطلوبة:</span> {item.orderItem.quantity}</p>
              {item.orderItem.selectedSize && (
                <p className="text-sm text-gray-600 mb-1"><span className="font-bold">المقاس:</span> {item.orderItem.selectedSize}</p>
              )}
              {item.orderItem.product?.slug && (
                <a href={`/products/${item.orderItem.product.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline mt-1 inline-block">
                  عرض المنتج في المتجر
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
            {/* Cost Input */}
            <div className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between gap-3 text-sm min-w-[200px]">
              <span className="font-bold text-gray-700">التكلفة الفعلية:</span>
              {editingCostId === item.id ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-brand"
                    value={editCostValue}
                    onChange={(e) => setEditCostValue(e.target.value)}
                    dir="ltr"
                  />
                  <button onClick={() => handleSaveCost(item.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingCostId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900" dir="ltr">
                    {item.actualCost !== null ? Number(item.actualCost).toFixed(2) : (item.orderItem.product?.costPrice ? Number(item.orderItem.product.costPrice).toFixed(2) : '0.00')} ر.ي
                  </span>
                  <button 
                    onClick={() => {
                      setEditCostValue(item.actualCost !== null ? String(item.actualCost) : String(item.orderItem.product?.costPrice || 0))
                      setEditingCostId(item.id)
                    }} 
                    className="text-gray-400 hover:text-brand"
                    title="تعديل التكلفة الفعلية"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Status Buttons */}
            <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => handleStatusChange(item.id, 'PURCHASED')}
                disabled={loadingId === item.id}
                className={`flex-1 flex justify-center items-center gap-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
                  item.status === 'PURCHASED' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Check size={14} /> تم الشراء
              </button>
              <button
                onClick={() => handleStatusChange(item.id, 'UNAVAILABLE')}
                disabled={loadingId === item.id}
                className={`flex-1 flex justify-center items-center gap-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
                  item.status === 'UNAVAILABLE' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <X size={14} /> غير متوفر
              </button>
              <button
                onClick={() => handleStatusChange(item.id, 'PENDING')}
                disabled={loadingId === item.id}
                className={`flex-1 flex justify-center items-center gap-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
                  item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Clock size={14} /> قيد الانتظار
              </button>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}
