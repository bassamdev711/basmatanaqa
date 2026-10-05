import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { createUserNotification } from '@/lib/notifications/service'
import { hashPassword, requireCurrentUser, revokeAllUserSessions, verifyPassword } from '@/lib/user-auth'

const schema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(10).max(128) })

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser()
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: 'تعذر تغيير كلمة المرور.' }, { status: 400 })
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } })
    await revokeAllUserSessions(user.id)
    await createUserNotification({ userId: user.id, type: 'PASSWORD_CHANGED', title: 'تم تغيير كلمة المرور', message: 'تم تغيير كلمة مرور حسابك وإنهاء الجلسات السابقة.' })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر تغيير كلمة المرور.' }, { status: 500 })
  }
}
