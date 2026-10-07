'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Star, Loader2 } from 'lucide-react'
import { adjustLoyaltyPoints } from '../actions'

type PointsManagerProps = {
  userId: string
  currentBalance: number
}

export default function PointsManager({ userId, currentBalance }: PointsManagerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<'EARN' | 'REDEEM'>('EARN')
  const [points, setPoints] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await adjustLoyaltyPoints(userId, type, Number(points), description)
      if (!result.success) {
        setError(result.error || 'حدث خطأ غير متوقع')
      } else {
        setIsOpen(false)
        setPoints('')
        setDescription('')
        router.refresh()
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => { setType('EARN'); setIsOpen(true) }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald/10 text-emerald hover:bg-emerald/20 font-bold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة نقاط
        </button>
        <button
          onClick={() => { setType('REDEEM'); setIsOpen(true) }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg transition-colors"
          disabled={currentBalance <= 0}
        >
          <Minus className="w-4 h-4" />
          خصم نقاط
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          {type === 'EARN' ? (
            <><Plus className="w-4 h-4 text-emerald" /> إضافة نقاط للمحفظة</>
          ) : (
            <><Minus className="w-4 h-4 text-red-600" /> خصم نقاط من المحفظة</>
          )}
        </h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          إلغاء
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">النقاط</label>
          <div className="relative">
            <input
              type="number"
              required
              min="1"
              max={type === 'REDEEM' ? currentBalance : undefined}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
              placeholder="مثال: 100"
            />
            <Star className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          {type === 'REDEEM' && (
            <p className="text-xs text-gray-500 mt-1">
              أقصى عدد يمكن خصمه: {currentBalance}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السبب / الملاحظات</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
            placeholder={type === 'EARN' ? 'مثال: تعويض عن تأخير الطلب' : 'مثال: خصم يدوي لخطأ سابق'}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !points || !description}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-white transition-colors ${
            type === 'EARN' 
              ? 'bg-emerald hover:bg-emerald/90' 
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : type === 'EARN' ? 'إضافة النقاط' : 'تأكيد الخصم'}
        </button>
      </div>
    </form>
  )
}
