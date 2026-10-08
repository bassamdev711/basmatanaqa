import { Metadata } from 'next'
import DispatchClient from './DispatchClient'

export const metadata: Metadata = {
  title: 'رسائل العملاء | لوحة التحكم'
}

export default function PushNotificationsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">رسائل الإشعارات</h1>
        <p className="text-gray-500 mt-2">إرسال إشعارات للعملاء تظهر في لوحة التحكم الخاصة بهم.</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DispatchClient />
      </div>
    </div>
  )
}
