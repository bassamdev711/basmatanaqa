'use client'

import { useToast } from '@/components/ToastProvider'

import React, { useState } from 'react'
import { updateOrderStatus } from '../actions'
import { CheckCircle2 } from 'lucide-react'

export default function OrderActionsClient({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const { showToast } = useToast()
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    const res = await updateOrderStatus(orderId, status)
    setIsUpdating(false)
    if (res.success) {
      showToast('success', 'تم تحديث حالة الطلب بنجاح!')
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="flex items-end gap-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-grow">
        <label className="block text-sm font-bold text-gray-700 mb-2">تحديث حالة الطلب</label>
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="AWAITING_PAYMENT">بانتظار الدفع</option>
          <option value="PENDING">قيد المراجعة</option>
          <option value="APPROVED">معتمد</option>
          <option value="SHIPPED">تم الشحن</option>
          <option value="COMPLETED">مكتمل</option>
          <option value="CANCELLED">ملغي</option>
        </select>
      </div>
      <button 
        onClick={handleUpdate}
        disabled={isUpdating || status === currentStatus}
        className="bg-brand text-white px-6 py-2 rounded-md font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <CheckCircle2 size={16} />
        {isUpdating ? 'جاري الحفظ...' : 'تحديث'}
      </button>
    </div>
  )
}
