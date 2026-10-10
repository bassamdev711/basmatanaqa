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
      let cursor: string | undefined = undefined
      const CHUNK_SIZE = 500

      while (true) {
        const users = (await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
          take: CHUNK_SIZE,
          skip: cursor ? 1 : undefined,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' }
        })) as { id: string }[]

        if (users.length === 0) break

        const notifications = users.map((user: { id: string }) => ({
          userId: user.id,
          type: 'SYSTEM',
          title: data.title,
          message: data.message
        }))

        await prisma.notification.createMany({
          data: notifications
        })

        cursor = users[users.length - 1].id
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
