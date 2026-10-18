import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  if (!checkRateLimit(`products_api_${ip}`, 120, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const collection = searchParams.get('collection') || undefined
  const subcategory = searchParams.get('subcategory') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
  const sort = searchParams.get('sort') || 'newest'
  const minPriceParam = searchParams.get('minPrice')
  const maxPriceParam = searchParams.get('maxPrice')
  const brandParam = searchParams.get('brand')

  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined
  const brands = brandParam ? brandParam.split(',').filter(Boolean) : []

  try {
    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
      stock: { gt: 0 },
      ...(collection ? { collection: { slug: collection } } : {}),
      ...(subcategory ? { subCategory: { slug: subcategory } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(brands.length > 0 ? { brand: { in: brands } } : {}),
    }

    let orderByClause:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[] = [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ]

    if (sort === 'price_asc') {
      orderByClause = { price: 'asc' }
    } else if (sort === 'price_desc') {
      orderByClause = { price: 'desc' }
    } else if (sort === 'newest') {
      orderByClause = { createdAt: 'desc' }
    }

    const skip = Math.max(0, (page - 1) * pageSize)

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          brand: true,
          price: true,
          compareAtPrice: true,
          imageUrl: true,
          featured: true,
          hasSizes: true,
        },
      }),
      prisma.product.count({ where: whereClause }),
    ])

    const formattedProducts = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      imageUrl: p.imageUrl || '',
      hasSizes: p.hasSizes,
    }))

    const hasMore = skip + products.length < totalCount

    return NextResponse.json({
      products: formattedProducts,
      totalCount,
      page,
      hasMore,
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
