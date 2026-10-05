import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { adjustPointsByAdmin } from '@/lib/loyalty/service'

const settingsSchema = z.object({ isEnabled: z.boolean(), pointsPerUnit: z.number().positive(), minimumOrderAmount: z.number().nonnegative(), redeemEnabled: z.boolean(), pointsValue: z.number().positive(), welcomeBonus: z.number().int().nonnegative(), expiryEnabled: z.boolean(), pointsExpiryDays: z.number().int().positive().nullable() })
const adjustSchema = z.object({ userId: z.string().min(1).max(100), points: z.number().int().positive(), type: z.enum(['ADMIN_CREDIT', 'ADMIN_DEBIT']), reason: z.string().trim().min(3).max(500) })

export async function GET() {
  await verifyAdmin()
  const settings = await prisma.loyaltySettings.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton' } })
  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  await verifyAdmin()
  const parsed = settingsSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'إعدادات الولاء غير صالحة.' }, { status: 400 })
  const settings = await prisma.loyaltySettings.upsert({ where: { id: 'singleton' }, update: parsed.data, create: { id: 'singleton', ...parsed.data } })
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  await verifyAdmin()
  const parsed = adjustSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'بيانات التعديل غير صالحة.' }, { status: 400 })
  const transaction = await adjustPointsByAdmin(parsed.data.userId, parsed.data.points, parsed.data.type, parsed.data.reason, 'admin')
  return NextResponse.json({ transaction }, { status: 201 })
}
