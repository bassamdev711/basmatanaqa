import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, User, Mail, Phone, Calendar, Star, ShoppingCart, Clock, CheckCircle, XCircle, Plus, Minus } from 'lucide-react'
import { getCustomerDetails } from '../actions'
import PointsManager from './PointsManager'
import CustomerSettings from './CustomerSettings'
import CustomerActions from './CustomerActions'
import { PointsHistoryList, OrdersHistoryList } from './CustomerHistoryLists'

export const metadata: Metadata = {
  title: 'تفاصيل العميل | لوحة التحكم',
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels = {
  NEW: 'جديد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
}

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { customer, pointsValue } = await getCustomerDetails(id)

  if (!customer) {
    notFound()
  }

  const loyaltyBalance = customer.loyaltyAccount?.balance || 0

  return (
    <div className="p-6 pb-20">
      <div className="mb-6">
        <Link 
          href="/admin/customers" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للعملاء
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Customer Details & Points */}
        <div className="space-y-6">
          
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald" />
              بيانات العميل
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald/10 text-emerald flex items-center justify-center font-bold text-xl">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{customer.name}</div>
                  <div className="flex items-center gap-2">
                    {customer.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">نشط</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">محظور</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span dir="ltr">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>تاريخ التسجيل: {new Date(customer.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              نقاط الولاء
            </h2>

            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-1">الرصيد الحالي</div>
              <div className="text-4xl font-black text-emerald flex justify-center items-center gap-2">
                {loyaltyBalance}
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="text-sm text-gray-400 mt-2">
                (تعادل {(loyaltyBalance * pointsValue).toLocaleString('ar-SA')} ريال)
              </div>
            </div>

            <PointsManager userId={customer.id} currentBalance={loyaltyBalance} />

          </div>

          {/* Account Settings */}
          <CustomerSettings userId={customer.id} isActive={customer.isActive} />

          {/* Customer Actions */}
          <CustomerActions customerId={customer.id} customerPhone={customer.phone} />

          {/* Points History */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              سجل النقاط
            </h2>

            <PointsHistoryList transactions={customer.loyaltyAccount?.transactions || []} />
          </div>
        </div>

        {/* Right Column: Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald" />
              طلبات العميل ({customer.orders.length})
            </h2>

            <OrdersHistoryList orders={customer.orders} />
          </div>
        </div>

      </div>
    </div>
  )
}
