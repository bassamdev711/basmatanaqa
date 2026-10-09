import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ProcurementDashboard() {
  await verifyAdmin()

  const tasks = await prisma.purchaseTask.findMany({
    include: {
      supplier: true,
      order: true,
      items: {
        include: {
          orderItem: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">إدارة المشتريات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{task.taskNumber}</h2>
                <Link href={`/admin/orders/${task.orderId}`} className="text-sm text-brand hover:underline">
                  طلب #{task.order.orderNumber || task.orderId.slice(-6)}
                </Link>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                task.status === 'PURCHASED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold">المورد:</span> {task.supplier?.name || 'غير محدد'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold">عدد المنتجات:</span> {task.items.length}
              </p>
            </div>

            <Link href={`/admin/procurement/${task.id}`} className="btn btn-primary w-full justify-center">
              عرض التفاصيل
            </Link>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            لا توجد مهام مشتريات حالياً
          </div>
        )}
      </div>
    </div>
  )
}
