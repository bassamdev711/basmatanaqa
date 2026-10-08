'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

export async function dispatchNotification(data: {
  target: 'ALL' | 'SPECIFIC'
  targetUserId?: string
  title: string
  message: string
}) {
  await verifyAdmin()

  try {
    if (data.target === 'SPECIFIC') {
      if (!data.targetUserId) {
        return { success: false, error: 'الرجاء اختيار العميل' }
      }

      await prisma.notification.create({
        data: {
          userId: data.targetUserId,
          type: 'SYSTEM',
          title: data.title,
          message: data.message
        }
      })
    } else {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })

      // Batch create notifications
      const notifications = users.map(user => ({
        userId: user.id,
        type: 'SYSTEM',
        title: data.title,
        message: data.message
      }))

      // Split into chunks if there are many users
      const CHUNK_SIZE = 500
      for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
        const chunk = notifications.slice(i, i + CHUNK_SIZE)
        await prisma.notification.createMany({
          data: chunk
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to dispatch notification', error)
    return { success: false, error: 'تعذر إرسال الإشعار' }
  }
}

export async function searchCustomers(query: string) {
  await verifyAdmin()
  
  if (!query || query.length < 2) return []

  const customers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } }
      ]
    },
    take: 10,
    select: {
      id: true,
      name: true,
      phone: true
    }
  })

  return customers
}
