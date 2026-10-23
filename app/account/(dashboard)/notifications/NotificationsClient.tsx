'use client'

import React, { useState } from 'react'
import { Bell, Check, CheckCheck, BellRing } from 'lucide-react'
import { markNotificationAsRead, markAllNotificationsAsRead } from './actions'
import { Notification } from '@prisma/client'

export default function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n))
    await markNotificationAsRead(id)
    window.dispatchEvent(new Event('notificationsRead'))
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })))
    await markAllNotificationsAsRead()
    window.dispatchEvent(new Event('notificationsRead'))
  }

  const unreadCount = notifications.filter(n => !n.readAt).length

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Bell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">لا توجد إشعارات حالياً</h3>
        <p className="text-foreground/50 text-xs sm:text-sm max-w-xs">
          سنقوم بإعلامك فور وجود تحديثات بخصوص طلباتك أو العروض الحصرية.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between bg-brand/5 border border-brand/15 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-brand">
            <BellRing size={15} />
            <span>لديك {unreadCount} {unreadCount === 1 ? 'إشعار غير مقروء' : 'إشعارات غير مقروءة'}</span>
          </div>
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover font-bold transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>تحديد الكل كمقروء</span>
          </button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex gap-4 ${
              !notification.readAt 
                ? 'bg-white border-brand/25 shadow-sm' 
                : 'bg-surface/70 border-foreground/6'
            }`}
          >
            <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              !notification.readAt ? 'bg-brand/10 text-brand' : 'bg-foreground/5 text-foreground/40'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                <h4 className={`text-xs sm:text-sm font-bold ${!notification.readAt ? 'text-foreground' : 'text-foreground/70'}`}>
                  {notification.title}
                </h4>
                <span className="text-[11px] text-foreground/45 font-medium whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${!notification.readAt ? 'text-foreground/85' : 'text-foreground/60'}`}>
                {notification.message}
              </p>
            </div>

            {!notification.readAt && (
              <button 
                onClick={() => handleMarkAsRead(notification.id)}
                className="shrink-0 text-foreground/30 hover:text-brand transition-colors p-1.5 rounded-lg hover:bg-surface cursor-pointer self-start"
                title="تحديد كمقروء"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
