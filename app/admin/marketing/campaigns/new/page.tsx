import Link from 'next/link'
import { createCampaign } from '../actions'
import CampaignImageUpload from './CampaignImageUpload'
import ProductSelector from '../ProductSelector'
import prisma from '@/lib/prisma'

export const metadata = { title: 'حملة جديدة | لوحة التحكم' }

export default async function NewCampaignPage() {
  const now = new Date()
  const today = now.toISOString().slice(0, 16)
  const nextMonthDate = new Date(now)
  nextMonthDate.setDate(nextMonthDate.getDate() + 30)
  const nextMonth = nextMonthDate.toISOString().slice(0, 16)

  // جلب جميع المنتجات النشطة
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, imageUrl: true }
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">حملة تسويقية جديدة</h2>
        <Link href="/admin/marketing/campaigns" className="text-sm text-gray-500 hover:text-gray-900">
          العودة
        </Link>
      </div>
      <form action={async (fd) => {
        'use server'
        await createCampaign(fd)
      }} className="space-y-6">
        {/* Campaign Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">معلومات الحملة</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الحملة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: عروض الصيف 2026"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رابط الحملة المخصص (Slug) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm" dir="ltr">/campaigns/</span>
              <input
                type="text"
                name="slug"
                required
                dir="ltr"
                placeholder="summer-sale"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">يُستخدم هذا الرابط لمشاركة الحملة في الإعلانات (يجب أن يكون باللغة الإنجليزية وبدون مسافات)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رسالة الحملة</label>
            <textarea
              name="description"
              rows={3}
              placeholder="مثال: استفد من خصم 20% على جميع المنتجات هذا الموسم!"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">صورة البانر (اختياري)</label>
            <CampaignImageUpload name="imageUrl" />
            <p className="text-xs text-gray-400 mt-2">ستظهر هذه الصورة في بانر الحملة على الموقع</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الخصم التلقائي (%)</label>
              <input
                type="number"
                name="discountPercentage"
                min="1"
                max="100"
                placeholder="مثال: 20"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">إذا تم إدخالها، سيتم خصم هذه النسبة من جميع منتجات الحملة</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كود كوبون مرتبط (اختياري)</label>
              <input
                type="text"
                name="couponCode"
                placeholder="مثال: SUMMER20"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-emerald bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">سيُعرض هذا الكود في بانر الحملة</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">المنتجات المشمولة في الحملة</h3>
          <p className="text-sm text-gray-500">اختر المنتجات التي تريد تطبيق الحملة عليها وعرضها في صفحة الحملة.</p>
          
          <ProductSelector products={products} />
        </div>

        {/* Duration */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">مدة الحملة</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startDate"
                required
                defaultValue={today}
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الانتهاء <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                required
                defaultValue={nextMonth}
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked className="w-4 h-4 rounded accent-emerald" />
            <span className="text-sm font-medium text-gray-700">تفعيل الحملة فور الإنشاء</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/marketing/campaigns"
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald text-white text-sm font-bold rounded-lg hover:bg-deep-green transition-colors"
          >
            إطلاق الحملة
          </button>
        </div>
      </form>
    </div>
  )
}
