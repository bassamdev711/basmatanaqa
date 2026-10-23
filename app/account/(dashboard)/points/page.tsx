import React from 'react'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'
import { Award, ShieldAlert, ArrowDownRight, ArrowUpLeft, History } from 'lucide-react'

export default async function AccountPointsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { userId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 15
      }
    }
  })

  const loyaltySettings = await prisma.loyaltySettings.findUnique({ where: { id: 'singleton' } })
  const pointsValue = Number(loyaltySettings?.pointsValue) || 1
  const pointsPerUnit = Number(loyaltySettings?.pointsPerUnit) || 10

  if (!loyaltyAccount) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 animate-slide-in-panel" dir="rtl">
        <div className="w-20 h-20 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-5 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-foreground">المكافآت غير متاحة</h2>
        <p className="text-xs sm:text-sm text-foreground/60 max-w-sm">
          عذراً، لم يتم العثور على حساب مكافآت مسجل باسمك حالياً.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-in-panel" dir="rtl">
      {/* Header */}
      <div className="border-b border-foreground/8 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">مكافآتي</h1>
          <Award className="w-6 h-6 text-accent" />
        </div>
        <p className="text-xs sm:text-sm text-foreground/60 font-medium">
          استفد من مكافآتك واستبدلها بخصومات مباشرة على طلباتك القادمة بكل سهولة.
        </p>
      </div>

      {/* Main Luxury Rewards Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand via-brand-hover to-brand-deep rounded-3xl p-6 sm:p-8 text-surface shadow-lg">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-surface/30 shadow-inner shrink-0">
              <Award className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
            </div>
            <div>
              <p className="text-surface/80 text-xs sm:text-sm font-semibold mb-1">رصيد مكافآتي المتاح حالياً</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">{loyaltyAccount.balance}</span>
                <span className="text-base font-bold text-surface/80">نقطة</span>
              </div>
              <p className="text-accent text-xs sm:text-sm mt-1 font-bold">
                (تعادل خصماً بقيمة {(loyaltyAccount.balance * pointsValue).toLocaleString('ar-SA')} ريال)
              </p>
            </div>
          </div>

          <div className="bg-surface/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-surface/20 text-center w-full md:w-auto">
            <p className="text-surface/70 text-xs font-medium mb-1">إجمالي المكافآت المكتسبة</p>
            <p className="font-black text-2xl text-white">{loyaltyAccount.lifetimeEarned}</p>
          </div>
        </div>

        {/* Rule explanation footer */}
        <div className="relative z-10 mt-6 pt-4 border-t border-surface/15 text-[11px] text-surface/80 font-medium">
          💡 يتم اكتساب رصيد مكافأة مع كل {pointsPerUnit} ريال مشتريات. وكل نقطة تمنحك خصماً فورياً بقيمة {pointsValue} ريال.
        </div>
      </div>

      {/* Rewards Transactions History */}
      <div>
        <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
          <History className="text-brand w-5 h-5" />
          <span>سجل حركات المكافآت</span>
        </h3>
        
        {loyaltyAccount.transactions.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center border border-foreground/6">
            <p className="text-foreground/50 text-xs sm:text-sm font-medium">لا توجد حركات مسجلة في رصيدك حتى الآن.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loyaltyAccount.transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between bg-white border border-foreground/8 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-brand/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.points >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {tx.points >= 0 ? <ArrowDownRight size={18} /> : <ArrowUpLeft size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs sm:text-sm mb-0.5">
                      {tx.type === 'EARN' ? 'اكتساب مكافآت مشتريات' : tx.type === 'REDEEM' ? 'استبدال مكافآت لخصم' : tx.type === 'ADJUST' ? 'تعديل إداري' : tx.type}
                    </p>
                    <p className="text-[11px] text-foreground/50">
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {tx.description && <p className="text-xs mt-1 text-foreground/70 font-medium">{tx.description}</p>}
                  </div>
                </div>
                <div className={`font-black text-base sm:text-lg ${tx.points >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} dir="ltr">
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
