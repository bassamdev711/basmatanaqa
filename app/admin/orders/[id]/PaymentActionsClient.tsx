'use client'

import React, { useState } from 'react'
import { updatePaymentStatus } from '../actions'
import { useToast } from '@/components/ToastProvider'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function PaymentActionsClient({ orderId, currentPaymentStatus }: { orderId: string, currentPaymentStatus: string }) {
  const { showToast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (status: string) => {
    setIsUpdating(true)
    const res = await updatePaymentStatus(orderId, status)
    setIsUpdating(false)
    if (res.success) {
      showToast('success', 'تم تحديث حالة الدفع بنجاح')
    } else {
      alert(res.error)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'بانتظار رفع الإيصال / غير مدفوع'
      case 'AWAITING_CONFIRMATION': return 'بانتظار المراجعة (تم رفع الإيصال)'
      case 'PAID': return 'مدفوع ومؤكد'
      case 'FAILED': return 'فشل الدفع'
      case 'AWAITING_CUSTOMER_SERVICE': return 'يحتاج إلى التواصل مع خدمة العملاء'
      case 'REJECTED': return 'الإيصال مرفوض'
      default: return status
    }
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-4">
        <span className="text-sm font-bold text-gray-700 block mb-1">حالة الدفع الحالية:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          currentPaymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
          currentPaymentStatus === 'AWAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-800' :
          currentPaymentStatus === 'AWAITING_CUSTOMER_SERVICE' ? 'bg-blue-100 text-blue-800' :
          currentPaymentStatus === 'REJECTED' || currentPaymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {getStatusLabel(currentPaymentStatus)}
        </span>
      </div>

      {currentPaymentStatus !== 'PAID' && (
        <div className="flex gap-2">
          <button 
            onClick={() => handleUpdate('PAID')}
            disabled={isUpdating}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-md font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            تأكيد الدفع (تحويل حالة الطلب إلى مدفوع)
          </button>
        </div>
      )}
    </div>
  )
}
