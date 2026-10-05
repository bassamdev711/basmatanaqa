import { NextRequest, NextResponse } from 'next/server'
import { validateCouponCode } from '@/app/admin/marketing/coupons/actions'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Strict rate limit: 10 attempts per 15 minutes per IP (prevent brute-force)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  if (!checkRateLimit(`coupon_${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ valid: false, error: 'تم تجاوز الحد المسموح به. يرجى الانتظار 15 دقيقة.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const code = typeof body?.code === 'string' ? body.code.trim().slice(0, 50) : ''
    const orderTotal = typeof body?.orderTotal === 'number' ? body.orderTotal : null

    if (!code || orderTotal === null || orderTotal < 0) {
      return NextResponse.json({ valid: false, error: 'بيانات غير صحيحة' }, { status: 400 })
    }

    const result = await validateCouponCode(code, orderTotal)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ valid: false, error: 'حدث خطأ أثناء التحقق من الكوبون' }, { status: 500 })
  }
}
