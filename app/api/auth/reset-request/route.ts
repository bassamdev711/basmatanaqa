import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { resetRequestSchema } from '@/lib/validation/user'
import { normalizePhone } from '@/lib/user-auth'
import { createAdminNotification } from '@/lib/admin-notifications'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  
  // Rate limit to prevent abuse
  if (!checkRateLimit(`reset_req:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'طلبات كثيرة، حاول لاحقًا.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const parsed = resetRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة.' }, { status: 400 })
    }

    const phone = normalizePhone(parsed.data.phone)
    
    if (!phone) {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب.' }, { status: 400 })
    }

    // Always return success to prevent user enumeration
    // but process silently if user exists.
    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (user) {
      await createAdminNotification({
        type: 'limit',
        title: 'طلب استعادة كلمة المرور',
        body: `العميل ${user.name} (${user.phone}) يطلب إعادة تعيين كلمة المرور. يرجى التحقق وإرسال الرابط عبر واتساب.`,
        url: `/admin/customers/${user.id}`,
        dedupeKey: `reset_req:${user.id}:${new Date().toISOString().slice(0, 10)}`, // Dedupe once per day
      })
    } else {
      // Create admin notification anyway so admin knows someone tried with an invalid number
      await createAdminNotification({
        type: 'limit',
        title: 'طلب استعادة لحساب غير موجود',
        body: `تم طلب استعادة كلمة مرور لرقم غير مسجل: ${phone}`,
        url: `/admin/customers`,
        dedupeKey: `reset_req_notfound:${phone}:${new Date().toISOString().slice(0, 10)}`,
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Reset request failed', error)
    return NextResponse.json({ error: 'تعذر معالجة الطلب.' }, { status: 500 })
  }
}
