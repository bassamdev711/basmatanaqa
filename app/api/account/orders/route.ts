import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/user-auth'

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser()
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const take = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)))
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, totalAmount: true, shippingFee: true, createdAt: true, items: { select: { id: true, quantity: true, price: true, productId: true, variantId: true } } },
    })
    return NextResponse.json({ orders: orders.map((order) => ({ ...order, totalAmount: Number(order.totalAmount), shippingFee: Number(order.shippingFee), items: order.items.map((item) => ({ ...item, price: Number(item.price) })) })) })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تحميل الطلبات.' }, { status: 500 })
  }
}
