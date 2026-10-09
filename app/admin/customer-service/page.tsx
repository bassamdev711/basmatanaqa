import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/auth'
import CustomerServiceActionsClient from './CustomerServiceActionsClient'

export const dynamic = 'force-dynamic'

export default async function CustomerServiceDashboard() {
  await verifyAdmin()

  // Customer service deals with orders that are NEW or PROCESSING
  const orders = await prisma.order.findMany({
    where: { 
      status: { in: ['NEW', 'PROCESSING'] }
    },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة خدمة العملاء</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Link href={`/admin/orders/${order.id}`} className="text-lg font-bold text-brand hover:underline">
                  طلب #{order.orderNumber || order.id.slice(-6)}
                </Link>
                <p className="text-sm text-gray-600 mt-1">العميل: {order.customerName} - {order.customerPhone}</p>
              </div>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-800">
                {order.status === 'NEW' ? 'جديد' : 'قيد التجهيز'}
              </span>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <span className="font-bold">الإجمالي الأصلي: </span> 
              {Number(order.totalAmount).toLocaleString('ar-SA')} ر.ي
            </div>

            <CustomerServiceActionsClient 
              orderId={order.id}
              initialAgreedAmount={Number(order.agreedAmount || order.totalAmount)}
              initialPaidAmount={Number(order.paidAmount || 0)}
              paymentStatus={order.paymentStatus}
            />
          </div>
        ))}

        {orders.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            لا توجد طلبات جديدة لخدمة العملاء حالياً
          </div>
        )}
      </div>
    </div>
  )
}
