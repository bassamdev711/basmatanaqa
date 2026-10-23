import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-auth'
import AccountSidebar from '@/components/account/AccountSidebar'
import Link from 'next/link'
import { Store, UserCheck, ArrowRight } from 'lucide-react'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/account/login')
  }

  const firstName = user.name.trim().split(' ')[0]
  const initial = user.name.trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-surface font-sans text-foreground" dir="rtl">
      {/* Top Brand Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-foreground/8 py-3.5 px-4 md:px-12 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-surface transition-all duration-300">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base md:text-lg text-foreground tracking-tight block">شهرزاد</span>
              <span className="text-[10px] text-foreground/50 tracking-widest font-semibold block uppercase">بوابة العميل</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-foreground/60 hover:text-brand transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>تصفح المتجر</span>
              <ArrowRight size={13} className="rotate-180" />
            </Link>

            <div className="h-4 w-px bg-foreground/10 hidden sm:block" />

            {/* User Pill */}
            <div className="flex items-center gap-2.5 bg-surface border border-foreground/8 px-3 py-1.5 rounded-full shadow-inner">
              <div className="w-7 h-7 rounded-full bg-brand text-surface flex items-center justify-center text-xs font-bold shadow-sm">
                {initial}
              </div>
              <div className="text-xs font-bold text-foreground/90">
                مرحباً، <span className="text-brand">{firstName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Account Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <AccountSidebar />
          
          <main className="flex-1 w-full bg-white rounded-3xl border border-foreground/8 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-5 sm:p-8 md:p-10 min-h-[65vh]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
