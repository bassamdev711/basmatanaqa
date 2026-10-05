import webpush from 'web-push'
import prisma from '@/lib/prisma'

export type AdminNotificationType = 'order' | 'limit'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      vapidPublicKey.trim(),
      vapidPrivateKey.trim(),
    )
  } catch (error) {
    console.error('Failed to set VAPID details:', error)
  }
}

export async function sendWebPushNotification(
  title: string,
  body: string,
  url = '/',
  type: AdminNotificationType = 'order',
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured. Skipping push notification.')
    return false
  }

  try {
    const preferences = await prisma.adminNotificationPreference.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    if (!preferences.pushEnabled) return false

    const categoryEnabled = type === 'order'
      ? preferences.orderNotifications
      : preferences.limitNotifications
    if (!categoryEnabled) return false

    const subscriptions = await prisma.adminSubscription.findMany()
    if (subscriptions.length === 0) return false

    const payload = JSON.stringify({ title, body, url, type })
    let sent = false

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
        sent = true
      } catch (error: unknown) {
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
          ? error.statusCode
          : undefined
        if (statusCode === 410 || statusCode === 404) {
          await prisma.adminSubscription.delete({ where: { id: sub.id } }).catch(() => undefined)
        } else {
          console.error('Error sending push notification to endpoint:', error)
        }
      }
    }))

    return sent
  } catch (error) {
    console.error('Failed to send push notifications:', error)
    return false
  }
}
