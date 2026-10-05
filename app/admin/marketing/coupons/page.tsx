import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Calendar, Users } from 'lucide-react'
import { deleteCoupon, toggleCoupon } from './actions'
import { getCurrency } from '@/lib/currency'

export const metadata = { title: 'كوبونات الخصم | لوحة التحكم' }

type Coupon = {
  id: string
  code: string
  description: string | null
  type: string
  value: number | string
  usedCount: number
  maxUses: number | null
  expiresAt: Date | string | null
  isActive: boolean
}

export default async function CouponsPage() {
  const currency = await getCurrency()

  let coupons: Coupon[] = []
  try {
    const dbCoupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    coupons = dbCoupons.map((coupon) => ({
      ...coupon,
      value: coupon.value.toNumber(),
    }))
  } catch {
    // DB offline
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">كوبونات الخصم</h2>
          <p className="text-gray-500 text-sm mt-1">{coupons.length} كوبون مسجَّل</p>
        </div>
        <Link
          href="/admin/marketing/coupons/new"
          className="flex items-center gap-2 bg-emerald text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-deep-green transition-colors"
        >
          <Plus className="w-4 h-4" />
          كوبون جديد
        </Link>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">لا توجد كوبونات بعد</p>
          <Link
            href="/admin/marketing/coupons/new"
            className="inline-flex items-center gap-2 mt-4 text-brand font-bold text-sm hover:underline"
          >
            <Plus className="w-4 h-4" />
            أنشئ أول كوبون
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">الكود</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">القيمة</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">الاستخدام</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">الانتهاء</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                const isExhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses

                return (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-deep-green bg-gray-100 px-2 py-1 rounded text-sm">
                        {coupon.code}
                      </span>
                      {coupon.description && (
                        <p className="text-gray-400 text-xs mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${coupon.type === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {coupon.type === 'PERCENTAGE' ? 'نسبة %' : 'مبلغ ثابت'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {coupon.type === 'PERCENTAGE'
                        ? `${Number(coupon.value)}%`
                        : `${Number(coupon.value).toLocaleString('ar-SA')} ${currency}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        <span>{coupon.usedCount}</span>
                        {coupon.maxUses && <span className="text-gray-400">/ {coupon.maxUses}</span>}
                        {isExhausted && (
                          <span className="text-red-500 text-xs font-bold mr-1">نفد</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {coupon.expiresAt ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                            {new Date(coupon.expiresAt).toLocaleDateString('ar-SA')}
                          </span>
                          {isExpired && <span className="text-red-400 text-xs">منتهي</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">لا ينتهي</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${coupon.isActive && !isExpired && !isExhausted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive && !isExpired && !isExhausted ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {coupon.isActive && !isExpired && !isExhausted ? 'نشط' : 'معطَّل'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/marketing/coupons/${coupon.id}/edit`}
                          className="text-xs text-brand font-bold hover:underline"
                        >
                          تعديل
                        </Link>
                        <form action={async () => {
                          'use server'
                          await toggleCoupon(coupon.id, !coupon.isActive)
                        }}>
                          <button type="submit" className="btn btn-ghost btn-icon text-gray-400 hover:text-brand">
                            {coupon.isActive ? <ToggleRight className="w-5 h-5 text-brand" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await deleteCoupon(coupon.id)
                        }}>
                          <button type="submit" className="btn btn-ghost btn-icon text-gray-400 hover:text-red-500" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
