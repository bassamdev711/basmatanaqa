import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  await verifyAdmin()
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)))
  const search = url.searchParams.get('q')?.trim().slice(0, 120)
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }, { email: { contains: search, mode: 'insensitive' as const } }] } : {}
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, name: true, phone: true, email: true, isActive: true, lastLoginAt: true, createdAt: true, loyaltyAccount: { select: { balance: true } }, _count: { select: { orders: true } } } }),
    prisma.user.count({ where }),
  ])
  return NextResponse.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}
