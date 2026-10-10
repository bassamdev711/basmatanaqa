'use client'

import React, { useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-foreground/40" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">لا توجد إشعارات</h3>
        <p className="text-foreground/60 text-sm">ليس لديك أي إشعارات في الوقت الحالي.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm text-brand hover:text-accent font-semibold transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-4 rounded-xl border transition-colors flex gap-4 ${
              !notification.readAt 
                ? 'bg-brand/5 border-brand/20' 
                : 'bg-surface border-foreground/5'
            }`}
          >
            <div className={`mt-1 shrink-0 ${!notification.readAt ? 'text-brand' : 'text-foreground/40'}`}>
              <Bell className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4 mb-1">
                <h4 className={`font-bold ${!notification.readAt ? 'text-foreground' : 'text-foreground/70'}`}>
                  {notification.title}
                </h4>
                <span className="text-xs text-foreground/50 whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${!notification.readAt ? 'text-foreground/80' : 'text-foreground/60'}`}>
                {notification.message}
              </p>
            </div>

            {!notification.readAt && (
              <button 
                onClick={() => handleMarkAsRead(notification.id)}
                className="shrink-0 text-foreground/30 hover:text-brand transition-colors p-2"
                title="تحديد كمقروء"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
