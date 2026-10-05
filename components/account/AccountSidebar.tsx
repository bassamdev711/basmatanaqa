import React from 'react'
import Link from 'next/link'
import { UserCircle, ShoppingBag, Star, LogOut, ArrowRight } from 'lucide-react'
import { logoutCustomer } from '@/app/account/actions'

export default function AccountSidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
      <Link href="/" className="flex items-center gap-2 text-sm text-foreground/60 hover:text-brand smooth-transition mb-4 px-4">
        <ArrowRight size={16} />
        العودة للرئيسية
      </Link>
      
      <div className="bg-white rounded-2xl border border-foreground/5 p-4 flex flex-col gap-1 shadow-sm">
        <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface smooth-transition font-semibold text-foreground/80 hover:text-brand">
          <UserCircle size={20} className="text-brand" />
          الملف الشخصي
        </Link>
        <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface smooth-transition font-semibold text-foreground/80 hover:text-brand">
          <ShoppingBag size={20} className="text-brand" />
          الطلبات السابقة
        </Link>
        <Link href="/account/points" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface smooth-transition font-semibold text-foreground/80 hover:text-brand">
          <Star size={20} className="text-brand" />
          نقاط الولاء
        </Link>
        
        <div className="h-px bg-foreground/5 my-2 w-full"></div>
        
        <form action={logoutCustomer} className="w-full">
          <button 
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 smooth-transition font-semibold cursor-pointer"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  )
}
