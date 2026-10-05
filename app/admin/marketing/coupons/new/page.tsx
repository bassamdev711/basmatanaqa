import Link from 'next/link'
import { createCoupon } from '../actions'


import { getPaymentSettings } from '@/app/admin/payment-settings/actions'

export const metadata = { title: 'كوبون جديد | لوحة التحكم' }

export default async function NewCouponPage() {
  const paymentSettings = await getPaymentSettings()
  const currency = paymentSettings?.currency || 'ر.س'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">كوبون خصم جديد</h2>
        <Link href="/admin/marketing/coupons" className="text-sm text-gray-500 hover:text-gray-900">
          العودة
        </Link>
      </div>
      <form action={async (fd) => {
        'use server'
        await createCoupon(fd)
      }} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">معلومات الكوبون</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كود الكوبون <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                required
                placeholder="مثال: SUMMER20"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-emerald bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">سيتم تحويله تلقائياً إلى أحرف كبيرة</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وصف للمدير (اختياري)</label>
              <input
                type="text"
                name="description"
                placeholder="مثال: حملة الصيف 2026"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">إعدادات الخصم</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الخصم <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              >
                <option value="PERCENTAGE">نسبة مئوية (%)</option>
                <option value="FIXED">مبلغ ثابت ({currency})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                قيمة الخصم <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="value"
                required
                min="0.01"
                step="0.01"
                placeholder="مثال: 20"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">للنسبة: 20 = 20% | للمبلغ: 50 = 50 {currency}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للطلب ({currency})</label>
              <input
                type="number"
                name="minOrderAmount"
                min="0"
                step="0.01"
                placeholder="اتركه فارغاً = لا يوجد حد أدنى"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للاستخدام</label>
              <input
                type="number"
                name="maxUses"
                min="1"
                placeholder="اتركه فارغاً = غير محدود"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">الصلاحية</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
            <input
              type="datetime-local"
              name="expiresAt"
              dir="ltr"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">اتركه فارغاً إذا كان الكوبون دائماً</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked className="w-4 h-4 rounded accent-emerald" />
            <span className="text-sm font-medium text-gray-700">تفعيل الكوبون فور الإنشاء</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/marketing/coupons"
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald text-white text-sm font-bold rounded-lg hover:bg-deep-green transition-colors"
          >
            إنشاء الكوبون
          </button>
        </div>
      </form>
    </div>
  )
}
