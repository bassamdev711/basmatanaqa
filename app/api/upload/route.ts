import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { verifyOrderUploadToken } from '@/lib/order-upload-token'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { UsageLimitError, markBlobDeleted, putTrackedBlob } from '@/lib/usage'
import crypto from 'crypto'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // رفع الحد الأقصى إلى 25 ميجابايت للتعامل مع الصور الاحترافية والكاميرات
const WARN_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/svg+xml',
  'application/pdf',
])

const MAGIC_BYTES: Record<string, { magic: Buffer; ext: string; mime: string }[]> = {
  'image/jpeg': [
    { magic: Buffer.from([0xff, 0xd8, 0xff]), ext: 'jpg', mime: 'image/jpeg' }
  ],
  'image/png': [
    { magic: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ext: 'png', mime: 'image/png' }
  ],
  'image/webp': [
    { magic: Buffer.from([0x52, 0x49, 0x46, 0x46]), ext: 'webp', mime: 'image/webp' }
  ],
  'image/gif': [
    { magic: Buffer.from([0x47, 0x49, 0x46, 0x38]), ext: 'gif', mime: 'image/gif' }
  ],
  'image/bmp': [
    { magic: Buffer.from([0x42, 0x4d]), ext: 'bmp', mime: 'image/bmp' }
  ],
  'image/heic': [
    { magic: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), ext: 'heic', mime: 'image/heic' },
    { magic: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), ext: 'heic', mime: 'image/heic' },
    { magic: Buffer.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70]), ext: 'heic', mime: 'image/heic' }
  ],
  'application/pdf': [
    { magic: Buffer.from([0x25, 0x50, 0x44, 0x46]), ext: 'pdf', mime: 'application/pdf' }
  ],
}

function detectFileType(buffer: Buffer): { ext: string; mime: string } | null {
  for (const signatures of Object.values(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (!buffer.subarray(0, signature.magic.length).equals(signature.magic)) continue
      if (signature.mime === 'image/webp' && buffer.subarray(8, 12).toString('ascii') !== 'WEBP') continue
      return { ext: signature.ext, mime: signature.mime }
    }
  }
  return null
}

function isAvif(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  return buffer.subarray(4, 8).toString('ascii') === 'ftyp' && ['avif', 'avis'].includes(buffer.subarray(8, 12).toString('ascii'))
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((part) => part.trim()).filter(Boolean)
  return (forwarded?.at(-1) || request.headers.get('x-real-ip') || 'unknown').slice(0, 64)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  let isAdmin = false

  try {
    await verifyAdmin(request.cookies.get('admin_token')?.value)
    isAdmin = true
  } catch {
    isAdmin = false
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'بيانات الرفع غير صالحة' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'لم يتم تحديد ملف صالح' }, { status: 400 })
  }

  const orderId = typeof formData.get('orderId') === 'string' ? String(formData.get('orderId')).trim() : ''
  const uploadToken = typeof formData.get('uploadToken') === 'string' ? String(formData.get('uploadToken')).trim() : ''
  const transactionId = typeof formData.get('transactionId') === 'string' ? String(formData.get('transactionId')).trim().slice(0, 100) : ''

  const isReceiptUpload = Boolean(orderId && uploadToken)

  if (isReceiptUpload) {
    if (!(await verifyOrderUploadToken(uploadToken, orderId))) {
      return NextResponse.json({ error: 'غير مصرح برفع هذا الملف' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentMethod: true, paymentStatus: true },
    })
    if (!order || !['bank_transfer', 'wallets'].includes(order.paymentMethod) || !['PENDING', 'FAILED', 'AWAITING_CONFIRMATION'].includes(order.paymentStatus)) {
      return NextResponse.json({ error: 'غير مصرح برفع الإيصال لهذا الطلب' }, { status: 403 })
    }
  } else if (!isAdmin) {
    return NextResponse.json({ error: 'غير مصرح برفع هذا الملف' }, { status: 403 })
  }

  // تطبيق حد التكرار فقط على رفع إيصالات التحويل من العملاء لمنع الإغراق
  // بينما يُستثنى لوحة الإدارة (الأدمن) من هذا الحد ليتمكن من رفع المنتجات بحرية
  if (isReceiptUpload) {
    const limitKey = `upload_receipt_${orderId}_${ip}`
    if (!checkRateLimit(limitKey, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'تم تجاوز حد رفع الملفات. يرجى المحاولة لاحقاً.' }, { status: 429 })
    }
  }

  // بعض المتصفحات والهواتف ترسل file.type فارغاً أو application/octet-stream لصور الكاميرا
  const fileName = (file.name || '').toLowerCase()
  const isImageByName = /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff|svg)$/i.test(fileName)
  const isImageFile = file.type.startsWith('image/') || isImageByName
  const isAllowedType = ALLOWED_MIME_TYPES.has(file.type) || isImageFile || file.type === '' || file.type === 'application/octet-stream'

  if (!isAllowedType || file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'نوع الملف أو حجمه غير مدعوم.' }, { status: file.size > MAX_FILE_SIZE ? 413 : 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let detectedType = detectFileType(buffer)
  if (!detectedType && file.type === 'image/avif' && isAvif(buffer)) {
    detectedType = { ext: 'avif', mime: 'image/avif' }
  }

  if (!isReceiptUpload) {
    // صور المنتجات: يجب أن يكون المحتوى الفعلي (Magic Bytes) صورة ويب سليمة تعرضها كل المتصفحات.
    // نرفض الملفات التالفة أو مجهولة النوع أو HEIC بدلاً من تخزين صورة لا تظهر للعملاء.
    const WEB_DISPLAYABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
    if (!detectedType && isAvif(buffer)) {
      detectedType = { ext: 'avif', mime: 'image/avif' }
    }
    if (!detectedType || !WEB_DISPLAYABLE.has(detectedType.mime)) {
      return NextResponse.json(
        { error: detectedType?.mime === 'image/heic' ? 'صيغة HEIC غير مدعومة للعرض. يرجى استخدام صورة JPG أو PNG' : 'ملف الصورة تالف أو بصيغة غير مدعومة' },
        { status: 415 }
      )
    }
  }

  if (!detectedType) {
    // محاولة استنتاج النوع من امتداد الملف إذا أرسل المتصفح ترويسة غير معيارية
    const extMatch = fileName.match(/\.([a-z0-9]+)$/i)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg'
    const mime = file.type && file.type.startsWith('image/') ? file.type : `image/${ext === 'jpg' ? 'jpeg' : ext}`
    detectedType = { ext, mime }
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    console.error('BLOB_READ_WRITE_TOKEN is not configured')
    return NextResponse.json({ error: 'خدمة التخزين غير مهيأة' }, { status: 503 })
  }

  const folder = isReceiptUpload ? 'receipts' : 'products'
  const filename = `${folder}/${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${detectedType.ext}`
  let uploadedUrl: string | undefined

  try {
    const blob = await putTrackedBlob(filename, buffer, {
      access: 'public',
      token: blobToken,
      contentType: detectedType.mime,
      cacheControlMaxAge: !isReceiptUpload ? 31536000 : 0,
    }, !isReceiptUpload ? 'product' : 'receipt', buffer.length)
    uploadedUrl = blob.url

    if (isReceiptUpload) {
      const updated = await prisma.order.updateMany({
        where: {
          id: orderId,
          paymentStatus: { in: ['PENDING', 'FAILED', 'AWAITING_CONFIRMATION'] },
        },
        data: {
          paymentProofUrl: uploadedUrl,
          transactionId: transactionId || undefined,
          paymentStatus: 'AWAITING_CONFIRMATION',
        },
      })

      if (updated.count !== 1) {
        await del(uploadedUrl, { token: blobToken })
        await markBlobDeleted(uploadedUrl)
        return NextResponse.json({ error: 'لم يعد الطلب متاحاً لإرفاق الإيصال' }, { status: 409 })
      }
    }

    const warning = file.size > WARN_FILE_SIZE
      ? `تنبيه: الملف كبير (${(file.size / 1024 / 1024).toFixed(1)}MB). يُنصح بضغطه لتحسين سرعة الموقع.`
      : undefined

    return NextResponse.json({ url: uploadedUrl, warning })
  } catch (error) {
    if (uploadedUrl && isReceiptUpload) {
      try {
        await del(uploadedUrl, { token: blobToken })
        await markBlobDeleted(uploadedUrl)
      } catch (cleanupError) {
        console.error('Blob cleanup failed:', cleanupError)
      }
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({
        error: 'تم بلوغ حصة تخزين الملفات في الخطة الحالية. يمكن للمتجر الاستمرار في العمل، لكن يلزم التواصل مع المالك للترقية قبل رفع ملفات جديدة.',
        code: 'USAGE_LIMIT_EXCEEDED',
        resource: error.resource,
      }, { status: 413 })
    }
    console.error('Blob upload error:', error)
    return NextResponse.json({ error: 'فشل رفع الملف. يرجى المحاولة لاحقاً.' }, { status: 500 })
  }
}
