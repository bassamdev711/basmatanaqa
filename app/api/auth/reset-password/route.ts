import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashOneTimeToken, hashPassword } from '@/lib/user-auth'
import { resetPasswordSchema } from '@/lib/validation/user'

export async function POST(request: Request) {
  try {
    const parsed = resetPasswordSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'تعذر تغيير كلمة المرور.' }, { status: 400 })
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashOneTimeToken(parsed.data.token) } })
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) return NextResponse.json({ error: 'تعذر تغيير كلمة المرور.' }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } })
      await tx.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } })
      await tx.userSession.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    })
    return NextResponse.json({ success: true })
  } catch {
    console.error('Password reset failed')
    return NextResponse.json({ error: 'تعذر تغيير كلمة المرور.' }, { status: 500 })
  }
}
