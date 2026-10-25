import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { createProductAsync, updateProductAsync } from '@/app/admin/products/actions'

/**
 * إنشاء منتج أو تعديله عبر Route Handler بدلاً من Server Action.
 * السبب: استدعاء Server Action يحتوي على revalidatePath يجبر المتصفح على تحديث
 * الصفحة الحالية (router refresh)، مما يقطع نموذج الإضافة المتعددة ويفقد حالته
 * بعد أول منتج. عبر هذا المسار يتم تحديث كاش الموقع دون لمس الصفحة المفتوحة.
 */
export async function POST(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
  }

  if (!payload || typeof payload.name !== 'string' || typeof payload.price !== 'number') {
    return NextResponse.json({ success: false, error: 'بيانات المنتج غير مكتملة' }, { status: 400 })
  }

  const res = await createProductAsync(payload)
  return NextResponse.json(res, { status: res.success ? 201 : 400 })
}

export async function PUT(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
  }

  if (!payload || !payload.id) {
    return NextResponse.json({ success: false, error: 'معرف المنتج مطلوب' }, { status: 400 })
  }

  const res = await updateProductAsync(payload)
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}
