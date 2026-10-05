import prisma from '@/lib/prisma'

export async function createUserNotification(input: {
  userId: string
  type: string
  title: string
  message: string
  data?: unknown
  dedupeKey?: string
}) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: { userId: input.userId, type: input.type, dataJson: { contains: input.dedupeKey } },
    })
    if (existing) return existing
  }
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 2000),
      dataJson: JSON.stringify({ ...(typeof input.data === 'object' && input.data ? input.data : {}), dedupeKey: input.dedupeKey }),
    },
  })
}
