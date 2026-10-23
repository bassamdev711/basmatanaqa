"use client";

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  UserCircle2, 
  ShoppingBag, 
  Award, 
  LogOut, 
  ArrowRight, 
  Bell, 
  Store, 
  ChevronLeft
} from 'lucide-react'
import { logoutCustomer } from '@/app/account/actions'
import NotificationBadge from '@/components/NotificationBadge'

export default function AccountSidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'الملف الشخصي',
      href: '/account',
      icon: UserCircle2,
      exact: true,
    },
    {
      name: 'سجل الطلبات',
      href: '/account/orders',
      icon: ShoppingBag,
      exact: false,
    },
    {
      name: 'مكافآتي',
      href: '/account/points',
      icon: Award,
      exact: false,
    },
    {
      name: 'الإشعارات',
      href: '/account/notifications',
      icon: Bell,
      exact: false,
      hasBadge: true,
    },
  ];

  return (
    <aside className="w-full md:w-72 shrink-0 flex flex-col gap-4" dir="rtl">
      {/* Return to store button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-xs font-bold text-foreground/70 hover:text-brand transition-colors px-3 py-2 rounded-xl hover:bg-surface w-fit"
      >
        <ArrowRight size={16} />
        <span>العودة للمتجر</span>
      </Link>
      
      {/* Navigation Card */}
      <div className="bg-white rounded-3xl border border-foreground/8 p-3 md:p-4 flex flex-col gap-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-foreground/40 uppercase">
          قائمة الحساب
        </div>

        {navigation.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname?.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-brand text-surface shadow-md shadow-brand/20'
                  : 'text-foreground/70 hover:text-brand hover:bg-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  size={19} 
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={`transition-colors ${
                    isActive ? 'text-accent' : 'text-brand/70 group-hover:text-brand'
                  }`} 
                />
                <span>{item.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.hasBadge && (
                  <div className="relative w-4 h-4">
                    <NotificationBadge />
                  </div>
                )}
                <ChevronLeft 
                  size={14} 
                  className={`transition-transform duration-200 ${
                    isActive ? 'text-surface/80' : 'text-foreground/20 group-hover:-translate-x-0.5 group-hover:text-foreground/50'
                  }`} 
                />
              </div>
            </Link>
          );
        })}
        
        <div className="h-px bg-foreground/6 my-2 w-full" />
        
        {/* Logout button */}
        <form action={logoutCustomer} className="w-full">
          <button 
            type="submit"
            className="flex w-full items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-red-50 text-red-600 transition-colors font-bold text-xs md:text-sm cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
              <span>تسجيل الخروج</span>
            </div>
          </button>
        </form>
      </div>
    </aside>
  );
}
