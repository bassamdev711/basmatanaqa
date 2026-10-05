import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { createOneTimeToken, hashOneTimeToken, normalizeEmail, normalizePhone } from '@/lib/user-auth'
import { resetRequestSchema } from '@/lib/validation/user'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)) return NextResponse.json({ message: 'إذا كانت البيانات صحيحة فستصل تعليمات الاستعادة.' })
  try {
    const parsed = resetRequestSchema.safeParse(await request.json())
    if (parsed.success) {
      const user = await prisma.user.findFirst({ where: parsed.data.phone ? { phone: normalizePhone(parsed.data.phone) } : { email: normalizeEmail(parsed.data.email) } })
      if (user) {
        const rawToken = createOneTimeToken()
        await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashOneTimeToken(rawToken), expiresAt: new Date(Date.now() + 15 * 60 * 1000) } })
        // لا يوجد Provider معتمد بعد؛ لا نعيد token ولا نسجله في logs.
      }
    }
  } catch { /* generic response intentionally hides account existence */ }
  return NextResponse.json({ message: 'إذا كانت البيانات صحيحة فستصل تعليمات الاستعادة.' })
}
