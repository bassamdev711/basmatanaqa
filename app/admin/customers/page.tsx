import { Metadata } from 'next'
import { getCustomers, getCustomerStats } from './actions'
import CustomersClient from './CustomersClient'

export const metadata: Metadata = {
  title: 'إدارة العملاء | لوحة التحكم',
  description: 'إدارة عملاء المتجر ونقاط الولاء الخاصة بهم',
}

export default async function CustomersPage() {
  const [customers, stats] = await Promise.all([
    getCustomers(),
    getCustomerStats(),
  ])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
        <p className="text-sm text-gray-500 mt-1">
          إدارة جميع المسجلين في المتجر، ومتابعة طلباتهم ونقاط ولائهم.
        </p>
      </div>

      <CustomersClient initialCustomers={customers} stats={stats} />
    </div>
  )
}
