import prisma from '@/lib/prisma'
import ProductsClient from './ProductsClient'
import { getCurrency } from '@/lib/currency'
import { Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'

type ProductVariantRecord = {
  id: string
  size: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  stock: number
}

type ProductRecord = {
  id: string
  slug: string
  name: string
  brand: string | null
  description: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  sku: string | null
  category: string | null
  size: string | null
  gender: string | null
  imageUrl: string | null
  images: string[]
  stock: number
  variants: ProductVariantRecord[]
}

export const revalidate = 3600 // Cache for 1 hour to boost speed

interface ProductsServerProps {
  type: 'bestsellers' | 'offers' | 'featured' | 'latest-48h'
  title: string
  subtitle: string
}

export default async function ProductsServer({ type, title, subtitle }: ProductsServerProps) {
  const currency = await getCurrency()
  let products: any[] = []
  
  try {
    const whereClause: Prisma.ProductWhereInput = { isActive: true, stock: { gt: 0 } }
    const orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }

    if (type === 'featured') {
      whereClause.featured = true
    } else if (type === 'bestsellers') {
      whereClause.bestseller = true
    } else if (type === 'latest-48h') {
      // آخر 48 ساعة
      const hours48Ago = new Date(Date.now() - 48 * 60 * 60 * 1000)
      whereClause.createdAt = { gte: hours48Ago }
    }

    const selectFields = {
      id: true,
      slug: true,
      name: true,
      brand: true,
      description: true,
      price: true,
      compareAtPrice: true,
      sku: true,
      category: true,
      size: true,
      gender: true,
      imageUrl: true,
      images: true,
      stock: true,
      createdAt: true,
      collection: {
        select: { name: true }
      },
      subCategory: {
        select: { name: true }
      },
      variants: {
        select: {
          id: true,
          size: true,
          price: true,
          compareAtPrice: true,
          stock: true,
        },
      },
      offers: {
        where: {
          isActive: true,
          endDate: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    }

    const getCachedProducts = unstable_cache(
      async () => {
        let fetchedProducts = await prisma.product.findMany({
          where: type === 'offers' ? {
            isActive: true,
            offers: {
              some: {
                isActive: true,
                endDate: { gt: new Date() }
              }
            }
          } : whereClause,
          orderBy: type === 'offers' ? undefined : orderByClause,
          take: type === 'offers' ? 20 : 8,
          select: selectFields,
        })

        // في حال اختيار قسم 48 ساعة ولم تكن هناك منتجات كافية مضافة في آخر 48 ساعة، نظهر أحدث المنتجات وصولاً كبديل أنيق
        if (type === 'latest-48h' && fetchedProducts.length === 0) {
          fetchedProducts = await prisma.product.findMany({
            where: { isActive: true, stock: { gt: 0 } },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: selectFields,
          })
        }

        if (type === 'offers') {
          fetchedProducts = fetchedProducts.slice(0, 8) // Take top 8 offers
        }
        return fetchedProducts
      },
      [`products-${type}`],
      { revalidate: 900, tags: ['products'] }
    )

    products = await getCachedProducts()

  } catch (e) {
    console.error('Could not load products from DB', e)
  }

  const hours48AgoTime = Date.now() - 48 * 60 * 60 * 1000

  const mapped = products.map((p: any) => {
    const activeOffer = p.offers?.[0]
    const price = activeOffer ? Number(activeOffer.offerPrice) : Number(p.price)
    const compareAtPrice = activeOffer ? Number(activeOffer.originalPrice) : (p.compareAtPrice ? Number(p.compareAtPrice) : undefined)
    const isNew48h = p.createdAt ? new Date(p.createdAt).getTime() >= hours48AgoTime : false
    
    return {
    id: p.slug,
    name: p.name,
    engName: p.brand || '',
    description: p.description || '',
    price: `${price.toLocaleString('ar-SA')} ${currency}`,
    rawPrice: price,
    compareAtPrice: compareAtPrice,
    offerEndDate: activeOffer ? activeOffer.endDate.toISOString() : undefined,
    code: p.sku || p.id.slice(0, 8).toUpperCase(),
    color: p.category || '',
    size: p.size || '',
    gender: p.gender || '',
    gradient: 'from-brand/20 to-accent/20',
    image: p.imageUrl || '',
    images: p.images || [],
    stock: p.stock ?? 0,
    slug: p.slug,
    collectionName: p.collection?.name || null,
    subCategoryName: p.subCategory?.name || null,
    isNew48h,
    variants: (p.variants || []).map((v: ProductVariantRecord) => ({
      id: v.id,
      size: v.size || '',
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stock: v.stock,
    })),
  }})

  if (mapped.length === 0) return null

  return <ProductsClient products={mapped} title={title} subtitle={subtitle} type={type} />
}
