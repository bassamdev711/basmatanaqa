import React from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, 
  ShoppingBag, 
  Award, 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Package, 
  Clock, 
  CreditCard,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react'
import { logoutCustomer } from '../actions'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'

export default async function AccountPage() {
  const user = await getCurrentUser()
  
  if (!user) return null

  // Fetch aggregate order stats
  const stats = await prisma.order.aggregate({
    where: { userId: user.id },
    _count: { id: true },
    _sum: { totalAmount: true }
  })

  // Fetch latest order for active status highlight
  const latestOrder = await prisma.order.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })

  // Fetch loyalty account points
  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id }
  })

  // Format join date
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null

  const initial = user.name.trim().charAt(0).toUpperCase()

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { text: 'مكتمل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'SHIPPED': return { text: 'تم الشحن', color: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'CANCELLED': return { text: 'ملغي', color: 'bg-red-50 text-red-700 border-red-200' }
      case 'REFUNDED': return { text: 'مسترجع', color: 'bg-neutral-50 text-neutral-700 border-neutral-200' }
      default: return { text: 'قيد المعالجة', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    }
  }

  return (
    <div className="space-y-8 animate-slide-in-panel" dir="rtl">
      {/* Account Restriction Notice if inactive */}
      {!user.isActive && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl animate-fade-in shadow-sm">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2 text-base md:text-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            حسابك مقيد حالياً
          </h3>
          <p className="text-red-700 text-xs md:text-sm mb-3">
            <span className="font-bold">السبب:</span> {user.restrictionReason || 'مخالفة سياسات المتجر'}
          </p>
          <p className="text-red-600 text-xs md:text-sm mb-4 leading-relaxed">
            لا يمكنك الطلب من المتجر أو تجميع النقاط حالياً بسبب هذا التقييد. يمكنك تصفح المنتجات فقط.<br/>
            إذا كنت ترغب في إجراء طلب، يجب عليك تسجيل الخروج والطلب كزائر (بدون حساب).
          </p>
          <form action={logoutCustomer}>
            <button type="submit" className="px-5 py-2.5 bg-white text-red-700 border border-red-200 hover:bg-red-100 rounded-xl text-xs md:text-sm font-bold transition-colors cursor-pointer">
              تسجيل الخروج والطلب كزائر
            </button>
          </form>
        </div>
      )}

      {/* Luxury Profile Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-l from-brand via-brand-hover to-brand-deep rounded-3xl p-6 sm:p-8 text-surface shadow-md">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface/15 backdrop-blur-md border border-surface/30 flex items-center justify-center text-accent text-2xl sm:text-3xl font-black shadow-inner">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                  {user.name}
                </h1>
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs sm:text-sm text-surface/80 font-medium">
                مرحباً بك في لوحة تحكم حسابك الخاص لدى شهرزاد
              </p>
              {joinDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-surface/60 mt-1">
                  <Calendar size={13} />
                  <span>عضو منذ {joinDate}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/products"
              className="w-full sm:w-auto px-4 py-2.5 bg-white text-brand hover:bg-surface font-bold text-xs rounded-xl shadow-sm text-center transition-all duration-200"
            >
              تصفح التشكيلات
            </Link>
            <Link
              href="/account/orders"
              className="w-full sm:w-auto px-4 py-2.5 bg-surface/15 hover:bg-surface/25 border border-surface/20 text-white font-bold text-xs rounded-xl text-center transition-all duration-200"
            >
              سجل الطلبات
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {/* Total Orders Metric */}
        <Link 
          href="/account/orders"
          className="group bg-surface rounded-2xl p-5 border border-foreground/6 hover:border-brand/30 transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground/50">إجمالي الطلبات</span>
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-foreground mb-1">
              {stats._count.id || 0}
            </p>
            <span className="text-[11px] font-bold text-brand group-hover:underline inline-flex items-center gap-1">
              <span>عرض سجل الطلبات</span>
              <ChevronLeft size={12} />
            </span>
          </div>
        </Link>

        {/* Total Spend Metric */}
        <div className="bg-surface rounded-2xl p-5 border border-foreground/6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground/50">إجمالي المشتريات</span>
            <div className="w-9 h-9 rounded-xl bg-accent/20 text-brand flex items-center justify-center">
              <CreditCard size={18} className="text-accent" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-foreground mb-1">
              {stats._sum.totalAmount ? Number(stats._sum.totalAmount.toString()).toLocaleString('ar-SA') : 0}
              <span className="text-xs font-normal text-foreground/60 mr-1.5">ريال</span>
            </p>
            <span className="text-[11px] text-foreground/50 font-medium">
              قيمة المشتريات المؤكدة
            </span>
          </div>
        </div>

        {/* Loyalty Points Metric */}
        <Link 
          href="/account/points"
          className="group bg-surface rounded-2xl p-5 border border-foreground/6 hover:border-brand/30 transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground/50">مكافآتي</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-foreground mb-1">
              {loyaltyAccount ? loyaltyAccount.balance : 0}
              <span className="text-xs font-normal text-foreground/60 mr-1.5">نقطة</span>
            </p>
            <span className="text-[11px] font-bold text-brand group-hover:underline inline-flex items-center gap-1">
              <span>تفاصيل مكافآتي</span>
              <ChevronLeft size={12} />
            </span>
          </div>
        </Link>
      </div>

      {/* Latest Active Order Highlight (if exists) */}
      {latestOrder && (
        <div className="bg-white rounded-2xl border border-foreground/8 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-foreground/6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <Package size={17} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">أحدث طلب مسجل</h3>
                <p className="text-[11px] text-foreground/50">
                  طلب رقم #{latestOrder.orderNumber || latestOrder.id.slice(-6)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(() => {
                const statusInfo = getOrderStatusLabel(latestOrder.status)
                return (
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                )
              })()}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-foreground/70">
                <span className="font-semibold text-foreground">عدد المنتجات: </span>
                {latestOrder.items.length} منتج
              </p>
              <p className="text-xs text-foreground/70">
                <span className="font-semibold text-foreground">الإجمالي: </span>
                {Number(latestOrder.totalAmount.toString()).toLocaleString('ar-SA')} ريال
              </p>
              <p className="text-[11px] text-foreground/50 flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {new Date(latestOrder.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/track?orderId=${latestOrder.orderNumber || latestOrder.id}`}
                className="w-full sm:w-auto text-center px-4 py-2 bg-surface hover:bg-foreground/5 text-foreground/80 font-bold text-xs rounded-xl border border-foreground/10 transition-colors"
              >
                تتبع الشحنة
              </Link>
              <Link
                href="/account/orders"
                className="w-full sm:w-auto text-center px-4 py-2 bg-brand text-surface hover:bg-brand-hover font-bold text-xs rounded-xl transition-colors"
              >
                عرض كل الطلبات
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Personal Info Card */}
      <div className="bg-surface rounded-2xl p-6 border border-foreground/6">
        <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={15} />
          <span>البيانات الشخصية المسجلة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-foreground/6">
            <p className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-brand" />
              <span>الاسم الكامل</span>
            </p>
            <p className="font-bold text-foreground text-sm truncate">{user.name}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-foreground/6">
            <p className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-brand" />
              <span>رقم الهاتف المعتمد</span>
            </p>
            <p className="font-bold text-foreground text-sm font-mono truncate" dir="ltr">
              {user.phone}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-foreground/6">
            <p className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-brand" />
              <span>البريد الإلكتروني</span>
            </p>
            <p className="font-bold text-foreground text-sm truncate font-mono">
              {user.email || 'غير مضاف'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
