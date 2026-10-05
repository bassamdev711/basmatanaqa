import React from 'react'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'
import { Star, Gift, ShieldAlert } from 'lucide-react'

export default async function AccountPointsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!loyaltyAccount) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 animate-slide-in-panel">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-brand" />
        </div>
        <h2 className="text-2xl font-bold mb-2">نظام النقاط غير متاح</h2>
        <p className="text-foreground/60">عذراً، لم يتم العثور على حساب ولاء خاص بك.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-in-panel">
      <div className="border-b border-foreground/10 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">نقاط الولاء</h1>
          <p className="text-foreground/60 font-medium">برنامج المكافآت الخاص بك في بصمة أناقة.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand to-brand-deep rounded-3xl p-8 text-surface relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-surface/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-surface/30">
              <Star className="w-10 h-10 text-accent" fill="currentColor" />
            </div>
            <div>
              <p className="text-surface/80 font-medium mb-1">الرصيد الحالي</p>
              <p className="text-5xl font-black">{loyaltyAccount.balance} <span className="text-lg font-medium text-surface/80">نقطة</span></p>
            </div>
          </div>
          <div className="bg-surface/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-surface/20 text-center">
            <p className="text-surface/70 text-sm mb-1">النقاط المكتسبة كلياً</p>
            <p className="font-bold text-xl">{loyaltyAccount.lifetimeEarned}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Gift className="text-brand w-5 h-5" />
          سجل النقاط
        </h3>
        
        {loyaltyAccount.transactions.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center border border-foreground/5">
            <p className="text-foreground/50 font-medium">لا توجد عمليات مسجلة في رصيدك حتى الآن.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loyaltyAccount.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-white border border-foreground/5 p-5 rounded-2xl shadow-sm hover:border-brand/20 smooth-transition">
                <div>
                  <p className="font-bold text-foreground mb-1">
                    {tx.type === 'EARN' ? 'اكتساب نقاط' : tx.type === 'REDEEM' ? 'استبدال نقاط' : tx.type === 'ADJUST' ? 'تعديل إداري' : tx.type}
                  </p>
                  <p className="text-xs text-foreground/50">{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</p>
                  {tx.description && <p className="text-sm mt-1 text-foreground/70">{tx.description}</p>}
                </div>
                <div className={`font-black text-lg ${tx.points >= 0 ? 'text-green-600' : 'text-red-500'}`} dir="ltr">
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
