import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { logoutCustomer } from '../actions'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'

export default async function AccountPage() {
  const user = await getCurrentUser()
  
  if (!user) return null

  const stats = await prisma.order.aggregate({
    where: { userId: user.id },
    _count: { id: true },
    _sum: { totalAmount: true }
  })

  return (
    <div className="space-y-8 animate-slide-in-panel">
      <div className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">الملف الشخصي</h1>
        <p className="text-foreground/60 font-medium">مرحباً بك في حسابك الشخصي لدى شهرزاد.</p>
        
        {!user.isActive && (
          <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              حسابك مقيد حالياً
            </h3>
            <p className="text-red-700 text-sm mb-3">
              <span className="font-bold">السبب:</span> {user.restrictionReason || 'مخالفة سياسات المتجر'}
            </p>
            <p className="text-red-600 text-sm mb-4 leading-relaxed">
              لا يمكنك الطلب من المتجر أو تجميع النقاط حالياً بسبب هذا التقييد. يمكنك تصفح المنتجات فقط.<br/>
              إذا كنت ترغب في إجراء طلب، يجب عليك تسجيل الخروج والطلب كزائر (بدون حساب)، ولكن لن يتم احتساب أي نقاط لطلبك.
            </p>
            <form action={logoutCustomer}>
              <button type="submit" className="px-5 py-2.5 bg-white text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors">
                تسجيل الخروج والطلب كزائر
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl p-6 border border-foreground/5">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-4">المعلومات الشخصية</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-foreground/50 mb-1">الاسم</p>
              <p className="font-semibold text-foreground text-lg">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/50 mb-1">رقم الهاتف</p>
              <p className="font-semibold text-foreground text-lg" dir="ltr">{user.phone}</p>
            </div>
            {user.email && (
              <div>
                <p className="text-xs text-foreground/50 mb-1">البريد الإلكتروني</p>
                <p className="font-semibold text-foreground text-lg">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-foreground/5 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-4">نظرة عامة على نشاطك</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-foreground/5 text-center">
              <p className="text-3xl font-black text-brand mb-1">{stats._count.id || 0}</p>
              <p className="text-xs text-foreground/60 font-semibold">إجمالي الطلبات</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-foreground/5 text-center">
              <p className="text-2xl font-black text-brand mb-1 truncate" dir="ltr">
                {stats._sum.totalAmount ? Number(stats._sum.totalAmount.toString()).toLocaleString() : 0}
              </p>
              <p className="text-xs text-foreground/60 font-semibold">الإنفاق الإجمالي</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
