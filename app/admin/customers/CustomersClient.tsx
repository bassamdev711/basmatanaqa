'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, User, ShoppingCart, Star, Calendar, ArrowRight } from 'lucide-react'

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string
  createdAt: Date
  isActive: boolean
  ordersCount: number
  totalOrdersValue: number
  loyaltyBalance: number
}

type CustomersClientProps = {
  initialCustomers: Customer[]
  stats: {
    totalCustomers: number
    newCustomersThisMonth: number
    customersWithOrders: number
    totalPointsEarned: number
    totalPointsRedeemed: number
  }
}

export default function CustomersClient({ initialCustomers, stats }: CustomersClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'ordersCount' | 'totalValue'>('newest')

  const filteredCustomers = useMemo(() => {
    let result = initialCustomers

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) || 
        c.phone.includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'ordersCount') return b.ordersCount - a.ordersCount
      if (sortBy === 'totalValue') return b.totalOrdersValue - a.totalOrdersValue
      return 0
    })

    return result
  }, [initialCustomers, searchQuery, sortBy])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي العملاء</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عملاء جدد (هذا الشهر)</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.newCustomersThisMonth}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عملاء لديهم طلبات</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.customersWithOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نقاط الولاء الممنوحة</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalPointsEarned}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="البحث بالاسم، البريد، أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20"
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald/20"
            >
              <option value="newest">الأحدث تسجيلًا</option>
              <option value="ordersCount">الأكثر طلبًا (عدد)</option>
              <option value="totalValue">الأكثر طلبًا (قيمة)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                <th className="px-6 py-4 font-medium">الطلبات</th>
                <th className="px-6 py-4 font-medium">إجمالي المدفوعات</th>
                <th className="px-6 py-4 font-medium">نقاط الولاء</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    لا يوجد عملاء يطابقون بحثك.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald/10 text-emerald flex items-center justify-center font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500" dir="ltr">{customer.phone}</div>
                          {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                        {customer.ordersCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {customer.totalOrdersValue} ر.س
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-yellow-600 font-bold">
                        <Star className="w-4 h-4 fill-yellow-600" />
                        {customer.loyaltyBalance}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">نشط</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">محظور</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <Link 
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-emerald hover:bg-emerald/5 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
