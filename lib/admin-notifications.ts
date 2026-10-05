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

  return { created: true, pushSent, notificationId: notification.id }
}
