import React from 'react'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'
import { Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AccountOrdersPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })

  return (
    <div className="space-y-8 animate-slide-in-panel">
      <div className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">الطلبات السابقة</h1>
        <p className="text-foreground/60 font-medium">سجل بجميع طلباتك السابقة وتتبع حالتها.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 text-center border border-foreground/5 flex flex-col items-center">
          <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-brand" />
          </div>
          <h3 className="text-xl font-bold mb-2">لم تقم بأي طلبات بعد</h3>
          <p className="text-foreground/60 mb-6 max-w-md">استكشف مجموعاتنا المميزة وابدأ بتجربة تسوق فريدة مع بصمة أناقة.</p>
          <Link href="/" className="btn btn-primary">
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-foreground/10 p-6 rounded-2xl hover:border-brand/30 smooth-transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-lg">طلب #{order.orderNumber || order.id.slice(-6)}</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status === 'COMPLETED' ? 'مكتمل' :
                     order.status === 'SHIPPED' ? 'تم الشحن' :
                     order.status === 'CANCELLED' ? 'ملغي' : 'قيد المعالجة'}
                  </span>
                </div>
                <div className="text-sm text-foreground/60 flex items-center gap-4">
                  <span>التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                  <span>المنتجات: {order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 border-foreground/5 pt-4 md:pt-0">
                <span className="font-black text-xl text-brand" dir="ltr">{Number(order.totalAmount.toString()).toLocaleString()} ر.ي</span>
                {/* Currently, detailed order view is not fully implemented on customer side, so we can just show this summary */}
                <button className="text-sm font-bold text-accent hover:text-brand flex items-center gap-1 transition-colors" disabled>
                  التفاصيل
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
