import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { createOneTimeToken } from '@/lib/user-auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin()
    const { id: customerId } = await context.params

    const user = await prisma.user.findUnique({
      where: { id: customerId }
    })

    if (!user) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    }

    const rawToken = createOneTimeToken()
    // We store the raw token in tokenHash column so we can retrieve it later
    const tokenHash = rawToken

    // Token valid for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    })

    // Return the link that admin will send to the user
    // The link uses the raw token
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const resetLink = `${origin}/account/reset/${rawToken}`

    return NextResponse.json({ resetLink })
  } catch (error) {
    console.error('Failed to create reset link', error)
    return NextResponse.json({ error: 'تعذر إنشاء رابط استعادة كلمة المرور' }, { status: 500 })
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin()
    const { id: customerId } = await context.params

    const activeToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: customerId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (activeToken) {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
      const resetLink = `${origin}/account/reset/${activeToken.tokenHash}`
      return NextResponse.json({ resetLink })
    }

    return NextResponse.json({ resetLink: null })
  } catch (error) {
    console.error('Failed to fetch reset link', error)
    return NextResponse.json({ error: 'تعذر جلب رابط الاستعادة' }, { status: 500 })
  }
}
