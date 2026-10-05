import { NextResponse } from 'next/server'
import { revokeCurrentUserSession } from '@/lib/user-auth'

export async function POST() {
  await revokeCurrentUserSession()
  return NextResponse.json({ success: true })
}
