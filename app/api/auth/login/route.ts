import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { createUserNotification, } from '@/lib/notifications/service'
import { createUserSession, normalizePhone, verifyPassword } from '@/lib/user-auth'
import { loginSchema } from '@/lib/validation/user'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 })
  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 })
    
    const rawIdentifier = parsed.data.identifier
    const isEmail = rawIdentifier.includes('@')
    const normalizedIdentifier = isEmail ? rawIdentifier.trim().toLowerCase() : normalizePhone(rawIdentifier)

    if (!checkRateLimit(`login_attempt:${normalizedIdentifier}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'محاولات دخول كثيرة خاطئة، تم قفل الحساب مؤقتاً لمدة 15 دقيقة.' }, { status: 429 })
    }

    const user = await prisma.user.findFirst({ 
      where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier } 
    })
    if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 })
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await createUserSession(user.id)
    await createUserNotification({ userId: user.id, type: 'NEW_LOGIN', title: 'تسجيل دخول جديد', message: 'تم تسجيل الدخول إلى حسابك بنجاح.' })
    return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email } })
  } catch {
    console.error('User login failed')
    return NextResponse.json({ error: 'تعذر تسجيل الدخول.' }, { status: 500 })
  }
}
