import React from 'react'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'
import { Package, ArrowLeft, Calendar, ShoppingBag, Clock, ExternalLink } from 'lucide-react'
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
    <div className="space-y-8 animate-slide-in-panel" dir="rtl">
      {/* Header */}
      <div className="border-b border-foreground/8 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">سجل الطلبات</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand/10 text-brand">
              {orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/60 font-medium">
            استعرض جميع طلباتك السابقة وتتبع مراحل الشحن والتوصيل بكل سهولة.
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-surface hover:bg-brand-hover rounded-xl text-xs font-bold transition-all shadow-sm w-fit"
        >
          <ShoppingBag size={15} />
          <span>متابعة التسوق</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface rounded-3xl p-10 sm:p-16 text-center border border-foreground/6 flex flex-col items-center">
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            <Package className="w-10 h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">لم تقم بأي طلبات بعد</h3>
          <p className="text-xs sm:text-sm text-foreground/60 mb-6 max-w-md leading-relaxed">
            استكشف تشكيلاتنا الفاخرة والمختارة بعناية وابدأ رحلة تسوق استثنائية مع شهرزاد.
          </p>
          <Link 
            href="/products" 
            className="px-6 py-3 bg-brand text-surface hover:bg-brand-hover rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand/15 transition-all"
          >
            تصفح المنتجات الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0)
            const orderDate = new Date(order.createdAt).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })

            return (
              <div 
                key={order.id} 
                className="bg-white border border-foreground/8 p-5 sm:p-6 rounded-2xl hover:border-brand/30 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-base sm:text-lg text-foreground">
                      طلب #{order.orderNumber || order.id.slice(-6)}
                    </span>

                    {/* Order Status Pill */}
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                      order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : 
                      order.status === 'REFUNDED' ? 'bg-neutral-50 text-neutral-700 border-neutral-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {order.status === 'COMPLETED' ? 'مكتمل' :
                       order.status === 'SHIPPED' ? 'تم الشحن' :
                       order.status === 'CANCELLED' ? 'ملغي' : 
                       order.status === 'REFUNDED' ? 'مسترجع' : 'قيد المعالجة'}
                    </span>
                    
                    {/* Payment Status Pill */}
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      order.paymentStatus === 'AWAITING_CONFIRMATION' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      order.paymentStatus === 'REJECTED' || order.paymentStatus === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}>
                      {order.paymentStatus === 'PAID' ? 'مدفوع' :
                       order.paymentStatus === 'AWAITING_CONFIRMATION' ? 'قيد مراجعة الدفع' :
                       order.paymentStatus === 'REJECTED' ? 'الإيصال مرفوض' : 
                       order.paymentStatus === 'AWAITING_CUSTOMER_SERVICE' ? 'تواصل مع الدعم' : 
                       order.paymentStatus === 'FAILED' ? 'فشل الدفع' : 'غير مدفوع'}
                    </span>
                  </div>

                  <div className="text-xs text-foreground/60 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-brand/70" />
                      <span>{orderDate}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Package size={13} className="text-brand/70" />
                      <span>{totalQty} {totalQty === 1 ? 'منتج' : 'منتجات'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 border-foreground/6 pt-4 md:pt-0">
                  <div className="text-right">
                    <span className="text-[11px] text-foreground/50 block">المبلغ الإجمالي</span>
                    <span className="font-black text-lg sm:text-xl text-brand" dir="ltr">
                      {Number(order.totalAmount.toString()).toLocaleString('ar-SA')} ريال
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/track?orderId=${order.orderNumber || order.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-foreground/10 hover:bg-surface text-foreground/70 transition-colors"
                    >
                      تتبع
                    </Link>
                    <Link 
                      href={`/account/orders/${order.id}`} 
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-surface text-brand hover:bg-brand hover:text-surface flex items-center gap-1 transition-all"
                    >
                      <span>التفاصيل</span>
                      <ArrowLeft size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
