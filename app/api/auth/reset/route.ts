import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashOneTimeToken, hashPassword, revokeAllUserSessions } from '@/lib/user-auth'

export async function POST(request: Request) {
  try {
    const { token, phone, password } = await request.json()

    if (!token || !phone || !password) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور قصيرة جداً' }, { status: 400 })
    }

    const tokenHash = hashOneTimeToken(token)

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    })

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'الرابط غير صالح أو منتهي الصلاحية' }, { status: 400 })
    }

    // Secondary validation: user must enter correct phone number
    if (resetRecord.user.phone !== phone) {
      return NextResponse.json({ error: 'رقم الهاتف غير متطابق مع الحساب' }, { status: 400 })
    }

    const newPasswordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      })
    ])

    // Revoke all existing sessions so user has to login with new password
    await revokeAllUserSessions(resetRecord.userId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Password reset failed', error)
    return NextResponse.json({ error: 'تعذر تغيير كلمة المرور' }, { status: 500 })
  }
}
