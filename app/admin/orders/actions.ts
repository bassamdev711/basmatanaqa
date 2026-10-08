'use server'

import { verifyAdmin } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { awardOrderPoints, reverseOrderPoints } from '@/lib/loyalty/service'
import { createUserNotification } from '@/lib/notifications/service'

const ORDER_STATUSES = new Set(['NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
const PAYMENT_STATUSES = new Set(['PENDING', 'AWAITING_CONFIRMATION', 'PAID', 'FAILED', 'AWAITING_CUSTOMER_SERVICE', 'REJECTED'])

export async function getOrders(statusFilter?: string, timeFilter?: string, search?: string, page = 1, limit = 50) {
  await verifyAdmin();

  const whereClause: Prisma.OrderWhereInput = {}

  if (statusFilter && statusFilter !== 'الكل') {
    if (statusFilter === 'جديد') whereClause.status = 'NEW'
    if (statusFilter === 'قيد التجهيز') whereClause.status = 'PROCESSING'
    if (statusFilter === 'مشحون') whereClause.status = 'SHIPPED'
    if (statusFilter === 'مكتمل') whereClause.status = 'COMPLETED'
    if (statusFilter === 'ملغى') whereClause.status = 'CANCELLED'
  }

  if (timeFilter) {
    const now = new Date()
    if (timeFilter === 'اليوم') {
      whereClause.createdAt = { gte: new Date(now.setHours(0,0,0,0)) }
    } else if (timeFilter === 'آخر 7 أيام') {
      whereClause.createdAt = { gte: new Date(now.setDate(now.getDate() - 7)) }
    } else if (timeFilter === 'آخر 30 يوم') {
      whereClause.createdAt = { gte: new Date(now.setDate(now.getDate() - 30)) }
    }
  }

  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
      { customerName: { contains: search, mode: 'insensitive' } }
    ]
  }

  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        items: { include: { product: true } },
        coupon: true
      }
    }),
    prisma.order.count({ where: whereClause })
  ]);

  // Serialize Decimal fields
  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    shippingFee: order.shippingFee.toNumber(),
    items: order.items.map((item) => ({
      ...item,
      price: item.price.toNumber(),
      product: item.product ? {
        ...item.product,
        price: item.product.price.toNumber(),
        compareAtPrice: item.product.compareAtPrice?.toNumber() ?? null,
      } : null,
    })),
    coupon: order.coupon ? {
      ...order.coupon,
      value: order.coupon.value.toNumber(),
      minOrderAmount: order.coupon.minOrderAmount?.toNumber() ?? null,
    } : null,
  }))

  return { 
    orders: serializedOrders, 
    totalCount, 
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getOrdersStats() {
  await verifyAdmin();

  const [total, pendingPayment, processing, shipped] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: { in: ['PENDING', 'AWAITING_CONFIRMATION'] } } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } })
  ])
  return { total, pendingPayment, processing, shipped }
}

export async function updateOrderStatus(orderId: string, status: string) {
  await verifyAdmin();
  if (!ORDER_STATUSES.has(status)) return { success: false, error: 'حالة الطلب غير صالحة' }

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!currentOrder) return { success: false, error: 'الطلب غير موجود' }

    let previousStatus = currentOrder.status;

    await prisma.$transaction(async (tx) => {
      const orderInTx = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!orderInTx) throw new Error('ORDER_NOT_FOUND')
      previousStatus = orderInTx.status

      if (previousStatus === status) return // No change

      if (previousStatus === 'CANCELLED' || previousStatus === 'REFUNDED') {
        throw new Error('INVALID_TRANSITION')
      }

      // 1. Update status ATOMICALLY
      const updateRes = await tx.order.updateMany({
        where: { 
          id: orderId,
          status: previousStatus 
        },
        data: { status }
      })

      if (updateRes.count !== 1) {
        throw new Error('CONCURRENT_TRANSITION_FAILED')
      }

      // 2. Handle cancellation: restore stock, decrement coupon
      if (status === 'CANCELLED') {
        for (const item of orderInTx.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            })
          } else if (item.productId) {
            await tx.product.updateMany({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            })
          }
        }
        
        if (orderInTx.couponId) {
          await tx.coupon.updateMany({
            where: { id: orderInTx.couponId },
            data: { usedCount: { decrement: 1 } }
          })
        }
      }
    })

    if (status === previousStatus) return { success: true }

    if (status !== previousStatus && currentOrder.userId) {
      await createUserNotification({
        userId: currentOrder.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'تحديث حالة الطلب',
        message: `تم تحديث حالة طلبك إلى ${status}.`,
        dedupeKey: `ORDER_STATUS:${orderId}:${status}`,
      })
    }
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      const transaction = await awardOrderPoints(orderId)
      if (transaction && currentOrder.userId) await createUserNotification({ userId: currentOrder.userId, type: 'POINTS_EARNED', title: 'تمت إضافة نقاط', message: `أضيفت ${transaction.points} نقطة لإكمال طلبك.`, dedupeKey: transaction.referenceKey })
    }
    if ((status === 'REFUNDED' || status === 'CANCELLED') && previousStatus !== status) {
      const transaction = await reverseOrderPoints(orderId)
      const reason = status === 'CANCELLED' ? 'الإلغاء' : 'الاسترجاع'
      if (transaction && currentOrder.userId) await createUserNotification({ userId: currentOrder.userId, type: 'POINTS_REVERSED', title: 'تم عكس نقاط الطلب', message: `تم عكس ${Math.abs(transaction.points)} نقطة بسبب ${reason}.`, dedupeKey: transaction.referenceKey })
    }
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_TRANSITION') {
      return { success: false, error: 'لا يمكن تغيير حالة طلب ملغى أو مسترجع.' }
    }
    if (error instanceof Error && error.message === 'CONCURRENT_TRANSITION_FAILED') {
      return { success: false, error: 'تم تحديث حالة الطلب من قبل مستخدم آخر في نفس الوقت.' }
    }
    console.error('Failed to update order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  await verifyAdmin();
  if (!PAYMENT_STATUSES.has(paymentStatus)) return { success: false, error: 'حالة الدفع غير صالحة' }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus }
    })
    if (paymentStatus === 'PAID' && order.status === 'COMPLETED') {
      const transaction = await awardOrderPoints(orderId)
      if (transaction && order.userId) await createUserNotification({ userId: order.userId, type: 'POINTS_EARNED', title: 'تمت إضافة نقاط', message: `أضيفت ${transaction.points} نقطة لإكمال طلبك.`, dedupeKey: transaction.referenceKey })
    }
    revalidatePath('/admin/orders')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update payment status' }
  }
}

export async function deleteOrder(orderId: string) {
  await verifyAdmin();

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!currentOrder) return { success: false, error: 'الطلب غير موجود' }

    await prisma.$transaction(async (tx) => {
      // If it wasn't cancelled before, we should probably restore stock here just in case, 
      // but usually we expect admins to cancel first. Let's restore stock if it's not CANCELLED.
      if (currentOrder.status !== 'CANCELLED') {
        for (const item of currentOrder.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            })
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            })
          }
        }
        
        if (currentOrder.couponId) {
          await tx.coupon.update({
            where: { id: currentOrder.couponId },
            data: { usedCount: { decrement: 1 } }
          })
        }
      }

      await tx.order.delete({
        where: { id: orderId }
      })
    })

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete order:', error)
    return { success: false, error: 'Failed to delete order' }
  }
}
