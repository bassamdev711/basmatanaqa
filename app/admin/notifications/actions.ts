'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { getAdminNotificationPreferences } from '@/lib/admin-notifications'

export async function getNotificationSettings() {
  await verifyAdmin()
  const preferences = await getAdminNotificationPreferences()
  const notifications = await prisma.inAppNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return {
    success: true as const,
    preferences,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    })),
  }
}

export async function saveNotificationSettings(input: {
  orderNotifications: boolean
  limitNotifications: boolean
}) {
  await verifyAdmin()
  const preferences = await prisma.adminNotificationPreference.upsert({
    where: { id: 'singleton' },
    update: {
      orderNotifications: Boolean(input.orderNotifications),
      limitNotifications: Boolean(input.limitNotifications),
    },
    create: {
      id: 'singleton',
      orderNotifications: Boolean(input.orderNotifications),
      limitNotifications: Boolean(input.limitNotifications),
    },
  })
  return { success: true as const, preferences }
}

export async function markNotificationRead(id: string) {
  await verifyAdmin()
  if (!id || id.length > 100) return { success: false as const, error: 'معرف الإشعار غير صالح' }
  await prisma.inAppNotification.updateMany({
    where: { id },
    data: { readAt: new Date() },
  })
  return { success: true as const }
}

export async function markAllNotificationsRead() {
  await verifyAdmin()
  await prisma.inAppNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  })
  return { success: true as const }
}

export async function testTelegramNotification() {
  await verifyAdmin()
  const { sendTelegramMessage } = await import('@/lib/telegram')
  const time = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const result = await sendTelegramMessage(
    `🎉 <b>مبروك! إشعار تجريبي من متجر بصمة أناقة</b>\n\nتم إعداد والتحقق من اتصال بوت تيليجرام مع هاتفك بنجاح 🚀\nستصلك إشعارات فورية هنا عند قيام أي عميل بطلب جديد!\n⏰ الوقت: ${time}`
  )
  return result
}
