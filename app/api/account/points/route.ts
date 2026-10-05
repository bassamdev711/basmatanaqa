import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/user-auth'

export async function GET() {
  try {
    const user = await requireCurrentUser()
    const account = await prisma.loyaltyAccount.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 100 } } })
    return NextResponse.json({ account })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تحميل النقاط.' }, { status: 500 })
  }
}
