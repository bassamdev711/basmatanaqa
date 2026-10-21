import { NextResponse } from 'next/server'
import sharp from 'sharp'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_ORIGIN = 'https://shahrazadstore.com'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const product = await prisma.product.findUnique({
    where: { slug: decodedSlug, isActive: true },
    select: { name: true, imageUrl: true },
  })

  if (!product?.imageUrl) {
    return new NextResponse('Image not found', { status: 404 })
  }

  const imageUrl = new URL(product.imageUrl, SITE_ORIGIN)
  if (imageUrl.protocol !== 'https:') {
    return new NextResponse('Unsupported image source', { status: 400 })
  }

  const upstream = await fetch(imageUrl, {
    headers: { Accept: 'image/*' },
    cache: 'force-cache',
  })

  if (!upstream.ok) {
    return new NextResponse('Unable to load product image', { status: 502 })
  }

  const source = Buffer.from(await upstream.arrayBuffer())
  const jpeg = await sharp(source)
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(1200, 1200, { fit: 'contain', background: '#ffffff' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()

  return new NextResponse(jpeg, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="${encodeURIComponent(product.name)}.jpg"`,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
