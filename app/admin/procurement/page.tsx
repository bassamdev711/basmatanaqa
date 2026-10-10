import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/auth'
import { Store, Package, ShoppingBag, Clock, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProcurementDashboard() {
  await verifyAdmin()

  // جلب المهام الفعالة لتجميعها حسب المورد
  const activeTasks = await prisma.purchaseTask.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIAL'] }
    },
    include: {
      supplier: true,
      items: {
        include: {
          orderItem: {
            include: { product: true }
          }
        }
      },
      order: true
    }
  })

  // تجميع البيانات حسب المورد
  const supplierStats: Record<string, {
    id: string | null
    name: string
    uniqueProducts: Set<string>
    totalItems: number
    ordersCount: Set<string>
    estimatedCost: number
    remainingItems: number
    oldestDate: Date | null
  }> = {}

  for (const task of activeTasks) {
    const sId = task.supplierId || 'unknown'
    if (!supplierStats[sId]) {
      supplierStats[sId] = {
        id: task.supplierId,
        name: task.supplier?.name || 'مورد غير محدد',
        uniqueProducts: new Set(),
        totalItems: 0,
        ordersCount: new Set(),
        estimatedCost: 0,
        remainingItems: 0,
        oldestDate: task.createdAt
      }
    }
    
    const stats = supplierStats[sId]
    stats.ordersCount.add(task.orderId)
    if (!stats.oldestDate || task.createdAt < stats.oldestDate) {
      stats.oldestDate = task.createdAt
    }

    for (const item of task.items) {
      const pKey = `${item.orderItem.productId}-${item.orderItem.variantId}-${item.orderItem.selectedSize}`
      stats.uniqueProducts.add(pKey)
      stats.totalItems += item.orderItem.quantity
      stats.estimatedCost += (Number(item.orderItem.product?.costPrice || 0) * item.orderItem.quantity)
      
      if (item.status === 'PENDING') {
        stats.remainingItems += item.orderItem.quantity
      }
    }
  }

  const suppliersList = Object.values(supplierStats).sort((a,b) => b.remainingItems - a.remainingItems)

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المشتريات المجمعة</h1>
        <p className="text-gray-500 text-sm">موردون معتمدون لديهم منتجات مطلوبة بانتظار الشراء الفعلي.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliersList.map(sup => (
          <div key={sup.id || 'unknown'} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-brand">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{sup.name}</h2>
                <div className="flex items-center text-xs font-bold text-amber-600 mt-1 gap-1">
                  <Clock size={12} />
                  أقدم طلب: {sup.oldestDate ? new Date(sup.oldestDate).toLocaleDateString('ar-SA') : '-'}
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-gray-500 text-xs font-bold mb-1 flex items-center gap-1"><ShoppingBag size={14} /> منتجات مختلفة</div>
                <div className="text-2xl font-black text-gray-900">{sup.uniqueProducts.size}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-gray-500 text-xs font-bold mb-1 flex items-center gap-1"><Package size={14} /> إجمالي القطع</div>
                <div className="text-2xl font-black text-gray-900">{sup.totalItems}</div>
              </div>
              
              <div className="col-span-2 flex justify-between items-center py-2 border-t border-gray-100 mt-2">
                <span className="text-sm text-gray-600 font-bold">الطلبات المرتبطة:</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{sup.ordersCount.size} طلب</span>
              </div>
              <div className="col-span-2 flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600 font-bold">المتبقي للشراء:</span>
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">{sup.remainingItems} قطعة</span>
              </div>
              <div className="col-span-2 flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600 font-bold">التكلفة التقديرية:</span>
                <span className="font-bold text-gray-900" dir="ltr">{sup.estimatedCost.toFixed(2)} ر.ي</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link href={`/admin/procurement/suppliers/${sup.id || 'unknown'}`} className="btn btn-primary w-full justify-between group">
                فتح قائمة المشتريات
                <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        {suppliersList.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد منتجات مطلوبة للشراء حالياً</h3>
            <p className="text-gray-500 text-sm">جميع الطلبات تم توفير منتجاتها.</p>
          </div>
        )}
      </div>
    </div>
  )
}
