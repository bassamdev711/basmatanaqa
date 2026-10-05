import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/user-auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt } })
}
