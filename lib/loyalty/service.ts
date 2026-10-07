import crypto from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'

export const LOYALTY_TYPES = {
  ORDER_REWARD: 'ORDER_REWARD',
  REDEEM: 'REDEEM',
  ORDER_REFUND: 'ORDER_REFUND',
  ADMIN_CREDIT: 'ADMIN_CREDIT',
  ADMIN_DEBIT: 'ADMIN_DEBIT',
  WELCOME_BONUS: 'WELCOME_BONUS',
  EXPIRED: 'EXPIRED',
} as const

type DbClient = PrismaClient | Prisma.TransactionClient

export async function createLoyaltyAccount(userId: string, db: DbClient = prisma) {
  return db.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

export async function awardOrderPoints(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.loyaltyTransaction.findUnique({
      where: { referenceKey: `ORDER_REWARD:${orderId}` },
    })
    if (existing) return existing

    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order || order.status !== 'COMPLETED') return null
    const paymentEligible = order.paymentStatus === 'PAID' || (order.paymentMethod === 'cod' && order.paymentStatus === 'PENDING')
    if (!paymentEligible) return null

    const settings = await tx.loyaltySettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    if (!settings.isEnabled || order.totalAmount.lt(settings.minimumOrderAmount)) return null

    const pointsPerUnit = Number(settings.pointsPerUnit)
    const points = Math.floor(Number(order.totalAmount) / pointsPerUnit)
    if (!Number.isFinite(points) || points <= 0) return null

    const account = await tx.loyaltyAccount.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
    })
    const balance = account.balance + points
    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { balance, lifetimeEarned: { increment: points } },
    })
    return tx.loyaltyTransaction.create({
      data: {
        userId: order.userId,
        accountId: account.id,
        orderId,
        type: LOYALTY_TYPES.ORDER_REWARD,
        points,
        balanceAfter: balance,
        referenceKey: `ORDER_REWARD:${orderId}`,
        description: `نقاط إكمال الطلب ${order.orderNumber || orderId}`,
      },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function reverseOrderPoints(orderId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Reverse the earned points (ORDER_REWARD)
    const reward = await tx.loyaltyTransaction.findUnique({ where: { referenceKey: `ORDER_REWARD:${orderId}` } })
    if (reward) {
      const referenceKey = `ORDER_REFUND:${orderId}`
      const existing = await tx.loyaltyTransaction.findUnique({ where: { referenceKey } })
      if (!existing) {
        const account = await tx.loyaltyAccount.findUnique({ where: { id: reward.accountId } })
        if (account) {
          const balance = account.balance - reward.points
          await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: { balance, lifetimeRedeemed: { increment: reward.points } },
          })
          await tx.loyaltyTransaction.create({
            data: {
              userId: reward.userId,
              accountId: account.id,
              orderId,
              type: LOYALTY_TYPES.ORDER_REFUND,
              points: -reward.points,
              balanceAfter: balance,
              referenceKey,
              description: 'عكس نقاط الطلب بعد الاسترجاع',
            },
          })
        }
      }
    }

    // 2. Refund any points that were redeemed (used) on this order
    const redeemed = await tx.loyaltyTransaction.findFirst({
      where: { orderId, type: 'REDEEM', referenceKey: { startsWith: 'REDEEM_' } }
    })
    
    if (redeemed) {
      const refundRefKey = `REFUND_REDEEM_${orderId}`
      const existingRefund = await tx.loyaltyTransaction.findFirst({ where: { referenceKey: refundRefKey } })
      
      if (!existingRefund) {
        const account = await tx.loyaltyAccount.findUnique({ where: { id: redeemed.accountId } })
        if (account) {
          const newBalance = account.balance + redeemed.points
          await tx.loyaltyAccount.update({
            where: { id: account.id },
            // It's a refund, so we add the points back to balance. 
            // We could deduct from lifetimeRedeemed or add to lifetimeEarned, but let's just restore balance.
            data: { balance: newBalance }
          })
          
          await tx.loyaltyTransaction.create({
            data: {
              userId: redeemed.userId,
              accountId: account.id,
              orderId,
              type: 'REFUND',
              points: redeemed.points,
              balanceAfter: newBalance,
              referenceKey: refundRefKey,
              description: 'استرجاع النقاط المستخدمة بعد إلغاء الطلب'
            }
          })
        }
      }
    }
    
    return reward || redeemed || null
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function adjustPointsByAdmin(userId: string, points: number, type: 'ADMIN_CREDIT' | 'ADMIN_DEBIT', reason: string, adminUserId: string) {
  if (!Number.isInteger(points) || points <= 0 || !reason.trim()) throw new Error('INVALID_LOYALTY_ADJUSTMENT')
  return prisma.$transaction(async (tx) => {
    const account = await tx.loyaltyAccount.upsert({ where: { userId }, update: {}, create: { userId } })
    const delta = type === LOYALTY_TYPES.ADMIN_CREDIT ? points : -points
    const balance = account.balance + delta
    if (balance < 0) throw new Error('INSUFFICIENT_POINTS')
    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: type === LOYALTY_TYPES.ADMIN_CREDIT
        ? { balance, lifetimeEarned: { increment: points } }
        : { balance, lifetimeRedeemed: { increment: points } },
    })
    return tx.loyaltyTransaction.create({
      data: {
        userId, accountId: account.id, type, points: delta, balanceAfter: balance,
        referenceKey: `${type}:${crypto.randomUUID()}`, description: reason.trim().slice(0, 500), adminUserId,
      },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function getLoyaltyBalance(userId: string) {
  return createLoyaltyAccount(userId)
}
