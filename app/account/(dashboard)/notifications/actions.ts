'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-auth'

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false }

  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id
      },
      data: {
        readAt: new Date()
      }
    })
    
    revalidatePath('/account/notifications')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser()
  if (!user) return { success: false }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    })
    
    revalidatePath('/account/notifications')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
