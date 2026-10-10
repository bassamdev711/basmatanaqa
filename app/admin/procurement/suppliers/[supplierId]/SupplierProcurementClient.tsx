'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, X, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { updateAggregatedProductStatus, updatePurchaseTaskItemStatus } from '../../actions'
import { useToast } from '@/components/ToastProvider'
import { useRouter } from 'next/navigation'

export type AggregatedOrder = {
  purchaseTaskItemId: string
  orderId: string
  orderNumber: string
  quantity: number
  status: string
  paymentStatus: string
  createdAt: Date
}

export type AggregatedItem = {
  key: string
  productId: string
  variantId: string | null
  selectedSize: string | null
  productName: string
  imageUrl: string | null
  costPrice: number
  totalRequired: number
  totalPurchased: number
  totalPending: number
  orders: AggregatedOrder[]
}

export default function SupplierProcurementClient({ 
  supplierId, 
  items 
}: { 
  supplierId: string, 
  items: AggregatedItem[] 
}) {
  const { showToast } = useToast()
  const router = useRouter()
  
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    const next = new Set(expandedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpandedKeys(next)
  }

  const handleAggregatedAction = async (item: AggregatedItem, status: string) => {
    const nextLoading = new Set(loadingKeys)
    nextLoading.add(item.key)
    setLoadingKeys(nextLoading)

    const res = await updateAggregatedProductStatus(
      supplierId,
      item.productId,
      item.variantId,
      item.selectedSize,
      status
    )

    const finishLoading = new Set(loadingKeys)
    finishLoading.delete(item.key)
    setLoadingKeys(finishLoading)

    if (res.success) {
      showToast('success', 'تم تحديث حالة المنتجات بنجاح')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleSingleOrderAction = async (order: AggregatedOrder, status: string) => {
    const nextLoading = new Set(loadingKeys)
    nextLoading.add(order.purchaseTaskItemId)
    setLoadingKeys(nextLoading)

    const res = await updatePurchaseTaskItemStatus(order.purchaseTaskItemId, status)

    const finishLoading = new Set(loadingKeys)
    finishLoading.delete(order.purchaseTaskItemId)
    setLoadingKeys(finishLoading)

    if (res.success) {
      showToast('success', 'تم تحديث حالة القطعة بنجاح')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <Check size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">اكتملت المشتريات</h3>
        <p className="text-gray-500 text-sm">تم توفير جميع المنتجات المطلوبة من هذا المورد بنجاح.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {items.map(item => {
        const isExpanded = expandedKeys.has(item.key)
        const isProcessing = loadingKeys.has(item.key)
        const isFullyPurchased = item.totalPending === 0

        return (
          <div key={item.key} className={`bg-white rounded-xl border ${isFullyPurchased ? 'border-emerald-200 shadow-sm' : 'border-gray-200 shadow-md'} overflow-hidden transition-all`}>
            {/* Header / Summary Row */}
            <div className={`p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between ${isFullyPurchased ? 'bg-emerald-50/30' : ''}`}>
              <div className="flex gap-4 flex-1">
                <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-lg relative flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-contain p-2 mix-blend-multiply" />
                  ) : (
                    <span className="text-gray-300 text-xs">لا توجد صورة</span>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{item.productName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {item.selectedSize && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">المقاس: {item.selectedSize}</span>
                    )}
                    <span className="text-gray-600"><span className="font-bold text-gray-900">إجمالي المطلوب:</span> {item.totalRequired}</span>
                    <span className="text-emerald-600"><span className="font-bold">تم الشراء:</span> {item.totalPurchased}</span>
                    <span className="text-red-600"><span className="font-bold">المتبقي:</span> {item.totalPending}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <span>موزعة على <strong className="text-gray-900">{item.orders.length}</strong> طلبات</span>
                    <button 
                      onClick={() => toggleExpand(item.key)}
                      className="text-brand hover:underline flex items-center gap-1 font-bold"
                    >
                      {isExpanded ? <><ChevronUp size={14}/> إخفاء التفاصيل</> : <><ChevronDown size={14}/> عرض تفاصيل الطلبات</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Aggregated Actions */}
              {!isFullyPurchased && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleAggregatedAction(item, 'PURCHASED')}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                  >
                    <Check size={18} /> شراء الكل ({item.totalPending})
                  </button>
                </div>
              )}
              {isFullyPurchased && (
                <div className="flex justify-center items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                  <Check size={18} /> مكتمل
                </div>
              )}
            </div>

            {/* Expanded Orders Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  تفاصيل طلبات العملاء لهذه القطعة:
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {item.orders.map(order => {
                    const isOrderLoading = loadingKeys.has(order.purchaseTaskItemId)
                    return (
                      <div key={order.purchaseTaskItemId} className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm gap-4">
                        <div className="flex flex-wrap items-center gap-4 flex-1 w-full">
                          <Link href={`/admin/orders/${order.orderId}`} className="font-black text-brand hover:underline flex items-center gap-1 text-sm min-w-[120px]">
                            طلب #{order.orderNumber}
                            <ExternalLink size={12} />
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-gray-500 border-r border-gray-200 pr-4">
                            <Clock size={12} />
                            {new Date(order.createdAt).toLocaleString('ar-SA')}
                          </div>
                          <div className="text-xs font-bold border-r border-gray-200 pr-4">
                            الكمية: <span className="text-gray-900 text-sm">{order.quantity}</span>
                          </div>
                          <div className="text-xs border-r border-gray-200 pr-4">
                            الدفع: 
                            <span className={`ml-1 font-bold ${
                              order.paymentStatus === 'PAID' ? 'text-emerald-600' : 
                              order.paymentStatus === 'PENDING' ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {order.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}
                            </span>
                          </div>
                        </div>

                        {/* Order Level Action */}
                        <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                          {order.status === 'PURCHASED' ? (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded">
                              <Check size={14} /> تم شراؤها
                            </span>
                          ) : order.status === 'UNAVAILABLE' ? (
                            <span className="text-red-600 font-bold text-xs flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded">
                              <X size={14} /> غير متوفرة
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSingleOrderAction(order, 'PURCHASED')}
                                disabled={isOrderLoading}
                                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                              >
                                <Check size={14} /> شراء
                              </button>
                              <button
                                onClick={() => handleSingleOrderAction(order, 'UNAVAILABLE')}
                                disabled={isOrderLoading}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                              >
                                <X size={14} /> مفقود
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
