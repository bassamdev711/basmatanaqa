'use client'

import React, { useState } from 'react'
import { markOrderReadyForShipping } from './actions'
import { useToast } from '@/components/ToastProvider'
import { Archive, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FulfillmentClient({ orderId }: { orderId: string }) {
  const { showToast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleMarkAsReady = async () => {
    setIsUpdating(true)
    const res = await markOrderReadyForShipping(orderId)
    setIsUpdating(false)
    if (res.success) {
      showToast('success', 'تم تجميع الطلب وتغليفه بنجاح!')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  return (
    <button 
      onClick={handleMarkAsReady}
      disabled={isUpdating}
      className="w-full mt-4 bg-gray-900 text-white px-4 py-3 rounded-md font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      <Archive size={18} />
      {isUpdating ? 'جاري الحفظ...' : 'تم التجميع، جاهز للشحن'}
    </button>
  )
}
