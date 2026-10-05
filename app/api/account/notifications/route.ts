import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/user-auth'

export async function GET() {
  try {
    const user = await requireCurrentUser()
    const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json({ notifications })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تحميل التنبيهات.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser()
    const body = await request.json() as { id?: unknown }
    if (typeof body.id !== 'string' || body.id.length > 100) return NextResponse.json({ error: 'معرف غير صالح.' }, { status: 400 })
    const updated = await prisma.notification.updateMany({ where: { id: body.id, userId: user.id, readAt: null }, data: { readAt: new Date() } })
    return NextResponse.json({ success: updated.count === 1 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تحديث التنبيه.' }, { status: 500 })
  }
}
