import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { createLoyaltyAccount } from '@/lib/loyalty/service'
import { createUserNotification } from '@/lib/notifications/service'
import { createUserSession, hashPassword, normalizeEmail, normalizePhone } from '@/lib/user-auth'
import { registerSchema } from '@/lib/validation/user'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) return NextResponse.json({ error: 'طلبات كثيرة، حاول لاحقًا.' }, { status: 429 })
  try {
    const parsed = registerSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'بيانات التسجيل غير صالحة.' }, { status: 400 })
    const phone = normalizePhone(parsed.data.phone)
    const email = normalizeEmail(parsed.data.email)
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name: parsed.data.name, phone, email, passwordHash: await hashPassword(parsed.data.password) } })
      await createLoyaltyAccount(created.id, tx)
      return created
    })
    await createUserSession(user.id)
    await createUserNotification({ userId: user.id, type: 'ACCOUNT_CREATED', title: 'مرحبًا بك في شهرزاد', message: 'تم إنشاء حسابك بنجاح.' })
    return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email } }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'تعذر إنشاء الحساب بالبيانات المقدمة.' }, { status: 409 })
    console.error('User registration failed')
    return NextResponse.json({ error: 'تعذر إنشاء الحساب.' }, { status: 500 })
  }
}
