import React from 'react'
import { getCurrentUser } from '@/lib/user-auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import NotificationsClient from './NotificationsClient'

export const metadata = {
  title: 'الإشعارات | حسابي',
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/account/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return (
    <div className="space-y-6 animate-slide-in-panel">
      <div className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">الإشعارات</h1>
        <p className="text-foreground/60 font-medium">متابعة أحدث التنبيهات الخاصة بحسابك.</p>
      </div>

      <NotificationsClient initialNotifications={notifications} />
    </div>
  )
}
