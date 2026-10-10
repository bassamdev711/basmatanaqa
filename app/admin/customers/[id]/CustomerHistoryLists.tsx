'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, ArrowRight, Clock, ShoppingCart } from 'lucide-react'

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels = {
  NEW: 'جديد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
}

export function PointsHistoryList({ transactions }: { transactions: any[] }) {
  const [visible, setVisible] = useState(5)

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        لا توجد عمليات نقاط حتى الآن
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {transactions.slice(0, visible).map(tx => (
        <div key={tx.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              {tx.type === 'EARN' ? (
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-bold">
                  <Plus className="w-3 h-3" /> اكتساب
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-bold">
                  <Minus className="w-3 h-3" /> خصم
                </span>
              )}
              <span className="font-bold text-gray-900" dir="ltr">{tx.points} pts</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
            </div>
          </div>
          
          <p className="text-sm text-gray-700">{tx.description}</p>
          
          {tx.order && (
            <Link 
              href={`/admin/orders/${tx.orderId}`}
              className="inline-block mt-2 text-xs text-emerald hover:underline"
            >
              الطلب المرتبط: #{tx.order.orderNumber}
            </Link>
          )}
        </div>
      ))}
      
      {visible < transactions.length && (
        <button 
          onClick={() => setVisible(v => v + 10)}
          className="w-full py-2 text-sm text-emerald bg-emerald/5 hover:bg-emerald/10 rounded-lg font-medium transition-colors mt-2"
        >
          عرض المزيد ({transactions.length - visible})
        </button>
      )}
    </div>
  )
}

export function OrdersHistoryList({ orders }: { orders: any[] }) {
  const [visible, setVisible] = useState(5)

  if (!orders || orders.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-gray-500">
        لا توجد طلبات لهذا العميل.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
            <tr>
              <th className="px-4 py-3 font-medium">الطلب</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">المنتجات</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.slice(0, visible).map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  #{order.orderNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {order.items?.length || 0} منتجات
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">
                  {Number(order.totalAmount)} ر.س
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-left">
                  <Link 
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-emerald hover:bg-emerald/5 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {visible < orders.length && (
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => setVisible(v => v + 10)}
            className="px-6 py-2 text-sm text-emerald bg-emerald/5 hover:bg-emerald/10 rounded-full font-medium transition-colors"
          >
            عرض المزيد ({orders.length - visible})
          </button>
        </div>
      )}
    </div>
  )
}
