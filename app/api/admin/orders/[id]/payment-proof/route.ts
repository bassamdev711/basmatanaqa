import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyAdmin()
    const { id } = await params
    if (!id || id.length > 64) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id },
      select: { paymentProofUrl: true },
    })
    if (!order?.paymentProofUrl) return NextResponse.json({ error: 'الإيصال غير موجود' }, { status: 404 })

    const proofUrl = order.paymentProofUrl
    const isR2 = proofUrl.includes('.r2.dev') || proofUrl.includes('.cloudflarestorage.com')

    if (isR2) {
      const { getFromR2 } = await import('@/lib/r2')
      const parsedUrl = new URL(proofUrl)
      const pathname = parsedUrl.pathname.replace(/^\/+/, '')
      const r2Obj = await getFromR2(pathname)

      if (!r2Obj || !r2Obj.Body) {
        return NextResponse.json({ error: 'تعذر قراءة الإيصال' }, { status: 404 })
      }

      const responseHeaders = new Headers()
      responseHeaders.set('Content-Type', r2Obj.ContentType || 'application/octet-stream')
      if (r2Obj.ContentLength) {
        responseHeaders.set('Content-Length', String(r2Obj.ContentLength))
      }
      responseHeaders.set('Cache-Control', 'private, no-store, max-age=0')
      responseHeaders.set('X-Content-Type-Options', 'nosniff')

      // @ts-expect-error Body has transformToWebStream in Node AWS SDK
      const webStream = typeof r2Obj.Body.transformToWebStream === 'function' ? r2Obj.Body.transformToWebStream() : r2Obj.Body
      return new NextResponse(webStream, { status: 200, headers: responseHeaders })
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) return NextResponse.json({ error: 'خدمة التخزين غير مهيأة' }, { status: 503 })

    const blobUrl = new URL(proofUrl)
    const pathname = blobUrl.pathname.replace(/^\/+/, '')
    if (!pathname.startsWith('receipts/')) {
      return NextResponse.json({ error: 'مسار الإيصال غير صالح' }, { status: 400 })
    }

    const blob = await get(pathname, { access: 'private', token: blobToken, useCache: false })
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return NextResponse.json({ error: 'تعذر قراءة الإيصال' }, { status: 404 })
    }

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', blob.blob.contentType || 'application/octet-stream')
    responseHeaders.set('Content-Length', String(blob.blob.size))
    responseHeaders.set('Content-Disposition', blob.blob.contentDisposition || 'inline')
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0')
    responseHeaders.set('X-Content-Type-Options', 'nosniff')

    return new NextResponse(blob.stream, { status: 200, headers: responseHeaders })
  } catch (error) {
    console.error('Failed to serve payment proof:', error)
    return NextResponse.json({ error: 'غير مصرح أو تعذر تحميل الإيصال' }, { status: 403 })
  }
}
