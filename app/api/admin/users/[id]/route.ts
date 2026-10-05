import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revokeAllUserSessions } from '@/lib/user-auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin()
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, phone: true, email: true, avatarUrl: true, isActive: true, emailVerifiedAt: true, phoneVerifiedAt: true, lastLoginAt: true, createdAt: true, loyaltyAccount: true, sessions: { select: { id: true, expiresAt: true, createdAt: true, lastUsedAt: true, revokedAt: true, ipAddress: true, userAgent: true }, orderBy: { createdAt: 'desc' }, take: 20 }, _count: { select: { orders: true, notifications: true } } } })
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود.' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin()
  const { id } = await params
  const body = await request.json() as { isActive?: unknown }
  if (typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'قيمة حالة الحساب غير صالحة.' }, { status: 400 })
  const user = await prisma.user.update({ where: { id }, data: { isActive: body.isActive }, select: { id: true, isActive: true } })
  if (!body.isActive) await revokeAllUserSessions(id)
  return NextResponse.json({ user })
}
