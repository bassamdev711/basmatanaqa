'use client'

import { useToast } from '@/components/ToastProvider'
import React, { useState } from 'react'
import { updateCustomerServiceData } from './actions'

export default function CustomerServiceActionsClient({
  orderId,
  initialAgreedAmount,
  initialPaidAmount,
  paymentStatus
}: {
  orderId: string,
  initialAgreedAmount: number,
  initialPaidAmount: number,
  paymentStatus: string
}) {
  const { showToast } = useToast()
  const [agreedAmount, setAgreedAmount] = useState(initialAgreedAmount)
  const [paidAmount, setPaidAmount] = useState(initialPaidAmount)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    const res = await updateCustomerServiceData(orderId, agreedAmount, paidAmount)
    setIsUpdating(false)
    if (res.success) {
      showToast('success', 'تم تحديث بيانات الدفع بنجاح')
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المتفق عليه</label>
        <input 
          type="number" 
          value={agreedAmount} 
          onChange={(e) => setAgreedAmount(Number(e.target.value))}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المدفوع (العربون / كامل)</label>
        <input 
          type="number" 
          value={paidAmount} 
          onChange={(e) => setPaidAmount(Number(e.target.value))}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-bold text-gray-700 mb-1">حالة الدفع</label>
        <div className="px-2 py-1 text-sm font-bold bg-white border border-gray-200 rounded">
          {paymentStatus === 'PAID' ? 'مكتمل' : 'معلق / جزئي'}
        </div>
      </div>
      <button 
        onClick={handleUpdate}
        disabled={isUpdating || (agreedAmount === initialAgreedAmount && paidAmount === initialPaidAmount)}
        className="bg-brand text-white px-6 py-1.5 rounded text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
      </button>
    </div>
  )
}
