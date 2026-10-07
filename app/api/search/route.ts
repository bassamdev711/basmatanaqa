import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  // Get IP (in API routes, it's a bit trickier, but we can try headers)
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  
  // Limit search to 30 requests per minute
  if (!checkRateLimit(`search_${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const rawQuery = searchParams.get('q')

  if (!rawQuery) {
    return NextResponse.json({ products: [] })
  }

  // Enforce maximum query length to prevent expensive DB operations
  const query = rawQuery.trim().slice(0, 100)

  try {
    const { getArabicSearchVariations } = await import('@/lib/search-utils');
    const variations = getArabicSearchVariations(query);
    const searchConditions = variations.map(v => ({
      OR: [
        { name: { contains: v, mode: 'insensitive' as const } },
        { brand: { contains: v, mode: 'insensitive' as const } },
        { category: { contains: v, mode: 'insensitive' as const } },
        { seoSearchPhrases: { hasSome: [v, v.toLowerCase()] } }
      ]
    }));

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        ...(searchConditions.length > 0 ? { OR: searchConditions } : {})
      },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        imageUrl: true,
        category: true
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
