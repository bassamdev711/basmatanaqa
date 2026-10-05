'use server'

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyOrderTrackingToken } from '@/lib/order-tracking-token'

type TrackOrder = {
  id: string
  orderNumber: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: unknown
  shippingFee: unknown
  createdAt: Date
  items: Array<{
    id: string
    product: { name: string; imageUrl: string | null } | null
    quantity: number
    price: unknown
  }>
}

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for')?.split(',').map((part) => part.trim()).filter(Boolean)
  return (headersList.get('x-real-ip') || forwarded?.at(-1) || '127.0.0.1').slice(0, 64)
}

function normalizeInput(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function isValidPhone(phone: string): boolean {
  return phone.length >= 7 && phone.length <= 32 && /^[+\d\s().-]+$/.test(phone)
}

function isValidOrderReference(orderReference: string): boolean {
  return orderReference.length >= 6 && orderReference.length <= 100 && /^[A-Za-z0-9_-]+$/.test(orderReference)
}

async function getOrder(reference: string): Promise<TrackOrder | null> {
  return prisma.order.findFirst({
    where: {
      OR: [{ id: reference }, { orderNumber: reference }],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  }) as Promise<TrackOrder | null>
}

function genericNotFound() {
  return { success: false as const, error: 'بيانات التتبع غير صحيحة أو لا يملك هذا الرابط صلاحية الوصول.' }
}

export async function trackOrderByOrderId(orderId: string, trackingToken?: string) {
  try {
    const headersList = await headers()
    const ip = getClientIp(headersList)
    if (!checkRateLimit(`track_id_${ip}`, 5, 15 * 60 * 1000)) {
      return { success: false, error: 'تم تجاوز الحد المسموح. يرجى المحاولة بعد 15 دقيقة.' }
    }

    const cleanOrderId = normalizeInput(orderId, 100)
    const cleanToken = normalizeInput(trackingToken, 2048)
    if (!isValidOrderReference(cleanOrderId) || !cleanToken) return genericNotFound()

    const order = await getOrder(cleanOrderId)
    if (!order || !(await verifyOrderTrackingToken(cleanToken, order.id))) return genericNotFound()

    return { success: true, order: formatOrderPayload(order) }
  } catch (error) {
    console.error('Track order error:', error)
    return { success: false, error: 'حدث خطأ أثناء البحث عن الطلب، يرجى المحاولة لاحقاً.' }
  }
}

export async function trackOrdersByPhone(phone: string, orderReference: string) {
  try {
    const headersList = await headers()
    const ip = getClientIp(headersList)
    if (!checkRateLimit(`track_phone_${ip}`, 5, 15 * 60 * 1000)) {
      return { success: false, error: 'تم تجاوز الحد المسموح. يرجى المحاولة بعد 15 دقيقة.' }
    }

    const cleanPhone = normalizeInput(phone, 32)
    const cleanOrderReference = normalizeInput(orderReference, 100)
    if (!isValidPhone(cleanPhone) || !isValidOrderReference(cleanOrderReference)) {
      return genericNotFound()
    }

    const order = await prisma.order.findFirst({
      where: {
        customerPhone: cleanPhone,
        OR: [{ id: cleanOrderReference }, { orderNumber: cleanOrderReference }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    }) as TrackOrder | null

    if (!order) return genericNotFound()

    return { success: true, orders: [formatOrderPayload(order)] }
  } catch (error) {
    console.error('Track order by phone and reference error:', error)
    return { success: false, error: 'حدث خطأ أثناء البحث عن الطلب، يرجى المحاولة لاحقاً.' }
  }
}

function formatOrderPayload(order: TrackOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: Number(order.totalAmount),
    shippingFee: Number(order.shippingFee),
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product?.name || 'منتج غير معروف',
      imageUrl: item.product?.imageUrl || null,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  }
}
