import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  
  if (!checkRateLimit(`search_${ip}`, 100, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const rawQuery = searchParams.get('q')

  if (!rawQuery) {
    return NextResponse.json({ products: [] })
  }

  const query = rawQuery.trim().slice(0, 100)

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 8,
      select: { id: true, name: true, slug: true, price: true, compareAtPrice: true, imageUrl: true, brand: true }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
