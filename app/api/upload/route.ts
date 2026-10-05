import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { verifyOrderUploadToken } from '@/lib/order-upload-token'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { UsageLimitError, markBlobDeleted, putTrackedBlob } from '@/lib/usage'
import crypto from 'crypto'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const WARN_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
])

const MAGIC_BYTES: Record<string, { magic: Buffer; ext: string; mime: string }[]> = {
  'image/jpeg': [{ magic: Buffer.from([0xff, 0xd8, 0xff]), ext: 'jpg', mime: 'image/jpeg' }],
  'image/png': [{ magic: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ext: 'png', mime: 'image/png' }],
  'image/webp': [{ magic: Buffer.from([0x52, 0x49, 0x46, 0x46]), ext: 'webp', mime: 'image/webp' }],
  'application/pdf': [{ magic: Buffer.from([0x25, 0x50, 0x44, 0x46]), ext: 'pdf', mime: 'application/pdf' }],
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

  if (!isAdmin) {
    if (!orderId || !uploadToken || !(await verifyOrderUploadToken(uploadToken, orderId))) {
      return NextResponse.json({ error: 'غير مصرح برفع هذا الملف' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentMethod: true, paymentStatus: true },
    })
    if (!order || !['bank_transfer', 'wallets'].includes(order.paymentMethod) || !['PENDING', 'FAILED', 'AWAITING_CONFIRMATION'].includes(order.paymentStatus)) {
      return NextResponse.json({ error: 'غير مصرح برفع الإيصال لهذا الطلب' }, { status: 403 })
    }
  }

  const limitKey = isAdmin ? `upload_admin_${ip}` : `upload_receipt_${orderId}_${ip}`
  const uploadLimit = isAdmin ? 30 : 5
  if (!checkRateLimit(limitKey, uploadLimit, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'تم تجاوز حد رفع الملفات. يرجى المحاولة لاحقاً.' }, { status: 429 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'نوع الملف أو حجمه غير مدعوم.' }, { status: file.size > MAX_FILE_SIZE ? 413 : 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let detectedType = detectFileType(buffer)
  if (!detectedType && file.type === 'image/avif' && isAvif(buffer)) {
    detectedType = { ext: 'avif', mime: 'image/avif' }
  }

  if (!detectedType || detectedType.mime !== file.type) {
    return NextResponse.json({ error: 'محتوى الملف لا يطابق النوع المُعلن عنه.' }, { status: 415 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    console.error('BLOB_READ_WRITE_TOKEN is not configured')
    return NextResponse.json({ error: 'خدمة التخزين غير مهيأة' }, { status: 503 })
  }

  const folder = isAdmin ? 'products' : 'receipts'
  const filename = `${folder}/${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${detectedType.ext}`
  let uploadedUrl: string | undefined

  try {
    const blob = await putTrackedBlob(filename, buffer, {
      access: isAdmin ? 'public' : 'private',
      token: blobToken,
      contentType: detectedType.mime,
      cacheControlMaxAge: isAdmin ? 31536000 : 0,
    }, isAdmin ? 'product' : 'receipt', buffer.length)
    uploadedUrl = blob.url

    if (!isAdmin) {
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
    if (uploadedUrl && !isAdmin) {
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
