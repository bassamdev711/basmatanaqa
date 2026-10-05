import { NextResponse } from 'next/server'
import { requireCurrentUser, revokeAllUserSessions, revokeCurrentUserSession } from '@/lib/user-auth'

export async function DELETE() {
  try {
    const user = await requireCurrentUser()
    await revokeAllUserSessions(user.id)
    await revokeCurrentUserSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    return NextResponse.json({ error: 'تعذر إنهاء الجلسات.' }, { status: 500 })
  }
}
