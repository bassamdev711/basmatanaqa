import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user-auth'
import AccountSidebar from '@/components/account/AccountSidebar'
import Link from 'next/link'
import { Store } from 'lucide-react'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/account/login')
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-foreground" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-foreground/5 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Store className="text-brand w-6 h-6" />
          <span className="font-bold text-lg text-foreground tracking-tight">بصمة أناقة</span>
        </Link>
        <div className="text-sm font-semibold text-foreground/80">
          مرحباً، {user.name.split(' ')[0]}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />
          
          <main className="flex-1 w-full bg-white rounded-3xl border border-foreground/5 shadow-sm p-6 md:p-10 min-h-[60vh]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
