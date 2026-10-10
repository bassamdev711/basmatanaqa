'use server'

import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashPassword, revokeAllUserSessions } from '@/lib/user-auth'

export async function getCustomers(query?: string) {
  await verifyAdmin()

  const whereClause = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const customers = await prisma.user.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { orders: true }
      },
      loyaltyAccount: true,
      orders: {
        select: {
          totalAmount: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return customers.map(customer => {
    const totalOrdersValue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      isActive: customer.isActive,
      ordersCount: customer._count.orders,
      totalOrdersValue,
      loyaltyBalance: customer.loyaltyAccount?.balance || 0,
    }
  })
}

export async function getCustomerStats() {
  await verifyAdmin()

  const [totalCustomers, newCustomersThisMonth, customersWithOrders] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.user.count({
      where: {
        orders: {
          some: {}
        }
      }
    })
  ])

  const totalPointsEarnedResult = await prisma.loyaltyTransaction.aggregate({
    where: { type: 'EARN' },
    _sum: { points: true }
  })
  
  const totalPointsRedeemedResult = await prisma.loyaltyTransaction.aggregate({
    where: { type: 'REDEEM' },
    _sum: { points: true }
  })

  return {
    totalCustomers,
    newCustomersThisMonth,
    customersWithOrders,
    totalPointsEarned: totalPointsEarnedResult._sum.points || 0,
    totalPointsRedeemed: totalPointsRedeemedResult._sum.points || 0,
  }
}

export async function getCustomerDetails(id: string) {
  await verifyAdmin()

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      loyaltyAccount: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            include: {
              order: {
                select: { orderNumber: true }
              }
            }
          }
        }
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true
        }
      }
    }
  })

  const loyaltySettings = await prisma.loyaltySettings.findUnique({ where: { id: 'singleton' } })
  return { customer, pointsValue: Number(loyaltySettings?.pointsValue) || 1 }
}

export async function adjustLoyaltyPoints(
  userId: string,
  type: 'EARN' | 'REDEEM',
  points: number,
  description: string
) {
  await verifyAdmin()

  if (points <= 0) {
    return { success: false, error: 'يجب أن تكون النقاط أكبر من صفر' }
  }

  try {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    })

    if (!account) {
      if (type === 'REDEEM') {
        return { success: false, error: 'العميل لا يملك رصيد نقاط كافي' }
      }
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        }
      })
    }

    if (type === 'REDEEM' && account.balance < points) {
      return { success: false, error: 'رصيد العميل غير كافٍ' }
    }

    const newBalance = type === 'EARN' ? account.balance + points : account.balance - points
    const lifetimeEarned = type === 'EARN' ? account.lifetimeEarned + points : account.lifetimeEarned
    const lifetimeRedeemed = type === 'REDEEM' ? account.lifetimeRedeemed + points : account.lifetimeRedeemed

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          balance: newBalance,
          lifetimeEarned,
          lifetimeRedeemed,
        }
      }),
      prisma.loyaltyTransaction.create({
        data: {
          userId,
          accountId: account.id,
          type,
          points,
          balanceAfter: newBalance,
          description: description || (type === 'EARN' ? 'إضافة نقاط يدوية من الإدارة' : 'خصم نقاط يدوي من الإدارة'),
          referenceKey: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          adminUserId: 'admin', // Ideally we'd store the actual admin ID
        }
      })
    ])

    revalidatePath(`/admin/customers/${userId}`)
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (error) {
    console.error('Failed to adjust points:', error)
    return { success: false, error: 'حدث خطأ أثناء تعديل النقاط' }
  }
}

export async function changeCustomerPassword(userId: string, newPassword: string) {
  await verifyAdmin()
  
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }
  }

  try {
    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    })
    
    await revokeAllUserSessions(userId)
    
    revalidatePath(`/admin/customers/${userId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to change password:', error)
    return { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' }
  }
}

export async function toggleCustomerStatus(userId: string) {
  await verifyAdmin()

  try {
    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    })

    if (!customer) {
      return { success: false, error: 'العميل غير موجود' }
    }

    const newStatus = !customer.isActive

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: newStatus }
    })

    if (!newStatus) {
      await revokeAllUserSessions(userId)
    }

    revalidatePath(`/admin/customers/${userId}`)
    revalidatePath('/admin/customers')
    return { success: true, isActive: newStatus }
  } catch (error) {
    console.error('Failed to toggle customer status:', error)
    return { success: false, error: 'حدث خطأ أثناء تغيير حالة الحساب' }
  }
}
