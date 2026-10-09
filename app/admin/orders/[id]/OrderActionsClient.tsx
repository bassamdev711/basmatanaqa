'use client'

import { useToast } from '@/components/ToastProvider'
import React, { useState } from 'react'
import { updateOrderStatus } from '../actions'
import { generatePurchaseTasks } from '../../procurement/actions'
import { CheckCircle2, Factory } from 'lucide-react'

export default function OrderActionsClient({ 
  orderId, 
  currentStatus,
  procurementStatus 
}: { 
  orderId: string, 
  currentStatus: string,
  procurementStatus?: string
}) {
  const { showToast } = useToast()
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleGenerateTasks = async () => {
    setIsGenerating(true)
    const res = await generatePurchaseTasks(orderId)
    setIsGenerating(false)
    if (res.success) {
      showToast('success', 'تم إنشاء مهام المشتريات بنجاح!')
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-grow">
          <label className="block text-sm font-bold text-gray-700 mb-2">تحديث حالة الطلب التجاري</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="NEW">جديد</option>
            <option value="PROCESSING">قيد التجهيز</option>
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

      {procurementStatus === 'PENDING' && (
        <div className="flex items-end justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-1">إدارة المشتريات</label>
            <p className="text-xs text-blue-700">هذا الطلب لم يتم إصدار مهام شراء له بعد.</p>
          </div>
          <button 
            onClick={handleGenerateTasks}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Factory size={16} />
            {isGenerating ? 'جاري الإصدار...' : 'إصدار مهام المشتريات'}
          </button>
        </div>
      )}
    </div>
  )
}
