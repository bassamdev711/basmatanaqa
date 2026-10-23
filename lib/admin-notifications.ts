import prisma from '@/lib/prisma'
import { sendWebPushNotification, type AdminNotificationType } from '@/lib/web-push'

export type AdminNotificationInput = {
  type: AdminNotificationType
  title: string
  body: string
  url?: string
  dedupeKey: string
}

export async function getAdminNotificationPreferences() {
  return prisma.adminNotificationPreference.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
}

export async function createAdminNotification(input: AdminNotificationInput) {
  const preferences = await getAdminNotificationPreferences()
  const enabled = input.type === 'order'
    ? preferences.orderNotifications
    : preferences.limitNotifications

  if (!enabled) return { created: false, pushSent: false }

  const notification = await prisma.inAppNotification.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {
      title: input.title,
      body: input.body,
      url: input.url,
    },
    create: {
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
      dedupeKey: input.dedupeKey,
    },
  })

  let pushSent = false
  try {
    pushSent = await sendWebPushNotification(input.title, input.body, input.url || '/admin/notifications', input.type)
  } catch (error) {
    console.error('Admin push notification failed:', error)
  }

  // Telegram alert for notifications other than the initial order creation (which sends a rich order card)
  if (!input.dedupeKey.endsWith(':created')) {
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram')
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://shahrazadstore.online').replace(/\/$/, '')
      const fullUrl = input.url ? (input.url.startsWith('http') ? input.url : `${baseUrl}${input.url}`) : ''
      const telegramText = `🔔 <b>${input.title}</b>\n\n${input.body}${fullUrl ? `\n\n🔗 <a href="${fullUrl}">عرض في لوحة الإدارة</a>` : ''}`
      await sendTelegramMessage(telegramText)
    } catch (telegramError) {
      console.error('Admin Telegram notification failed:', telegramError)
    }
  }

  return { created: true, pushSent, notificationId: notification.id }
}
