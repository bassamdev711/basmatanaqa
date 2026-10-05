import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, normalizeEmail, requireCurrentUser } from '@/lib/user-auth'
import { profileSchema } from '@/lib/validation/user'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt } })
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser()
    const parsed = profileSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'بيانات الملف غير صالحة.' }, { status: 400 })
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, email: parsed.data.email === undefined ? undefined : normalizeEmail(parsed.data.email) } })
    return NextResponse.json({ user: { id: updated.id, name: updated.name, phone: updated.phone, email: updated.email, avatarUrl: updated.avatarUrl } })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'البريد مستخدم مسبقًا.' }, { status: 409 })
    return NextResponse.json({ error: 'تعذر تحديث الملف.' }, { status: 500 })
  }
}
