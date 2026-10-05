import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

  // Rate limit: 60 view events per hour per IP
  if (!checkRateLimit(`track_view_${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const productId = typeof body?.productId === 'string' ? body.productId.trim() : ''

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    await prisma.product.update({
      where: { id: productId },
      data: { viewsCount: { increment: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch {
    // If product doesn't exist, Prisma will throw — swallow silently for tracking
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
