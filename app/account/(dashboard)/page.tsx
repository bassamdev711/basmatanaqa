import React from 'react'
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
        <p className="text-foreground/60 font-medium">مرحباً بك في حسابك الشخصي لدى بصمة أناقة.</p>
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
