import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/user-auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser()
    const { id } = await params
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: { include: { product: { select: { name: true, slug: true, imageUrl: true } }, variant: { select: { size: true } } } }, coupon: true },
    })
    if (!order) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 })
    return NextResponse.json({ order: { ...order, totalAmount: Number(order.totalAmount), shippingFee: Number(order.shippingFee), items: order.items.map((item) => ({ ...item, price: Number(item.price) })), coupon: order.coupon ? { ...order.coupon, value: Number(order.coupon.value), minOrderAmount: order.coupon.minOrderAmount ? Number(order.coupon.minOrderAmount) : null } : null } })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تحميل الطلب.' }, { status: 500 })
  }
}
