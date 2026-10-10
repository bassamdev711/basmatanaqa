'use client'

import React, { useState } from 'react'
import { updatePaymentStatus, updateOrderStatus } from '../actions'
import { generatePurchaseTasks } from '../../procurement/actions'
import { useToast } from '@/components/ToastProvider'
import { CheckCircle2, Factory } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PaymentActionsClient({ orderId, currentPaymentStatus }: { orderId: string, currentPaymentStatus: string }) {
  const { showToast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleConfirmAll = async () => {
    setIsUpdating(true)
    
    // 1. Update Payment Status to PAID
    const paymentRes = await updatePaymentStatus(orderId, 'PAID')
    if (!paymentRes.success) {
      alert(paymentRes.error)
      setIsUpdating(false)
      return
    }

    // 2. Update Order Status to PROCESSING
    await updateOrderStatus(orderId, 'PROCESSING')

    // 3. Generate Purchase Tasks
    await generatePurchaseTasks(orderId)

    setIsUpdating(false)
    showToast('success', 'تم تأكيد الدفع وإصدار مهام المشتريات بنجاح!')
    router.refresh()
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
            onClick={handleConfirmAll}
            disabled={isUpdating}
            className="w-full bg-emerald-600 text-white px-4 py-3 rounded-md font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Factory size={18} />
            {isUpdating ? 'جاري المعالجة...' : 'تأكيد الدفع وإصدار مهام المشتريات التلقائية'}
          </button>
        </div>
      )}
    </div>
  )
}
