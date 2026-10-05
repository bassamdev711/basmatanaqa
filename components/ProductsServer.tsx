import prisma from '@/lib/prisma'
import ProductsClient from './ProductsClient'
import { getCurrency } from '@/lib/currency'
import { Prisma } from '@prisma/client'

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
  type: 'bestsellers' | 'offers' | 'featured'
  title: string
  subtitle: string
}

export default async function ProductsServer({ type, title, subtitle }: ProductsServerProps) {
  const currency = await getCurrency()
  let products: ProductRecord[] = []
  
  try {
    const whereClause: Prisma.ProductWhereInput = { isActive: true, stock: { gt: 0 } }
    const orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }

    if (type === 'featured') {
      whereClause.featured = true
    } else if (type === 'offers') {
      // Products where compareAtPrice is strictly greater than price
      // Since they are strings/decimals in Prisma, we use raw query or filter in JS if complex.
      // But for simplicity, we can fetch all active and filter in JS if we don't have a specific field.
      // A better way is using Prisma's gt if it's stored as Float/Decimal, but if it's String it's tricky.
      // Assuming compareAtPrice is a number or convertible. Let's just fetch recent and filter if needed.
    } else if (type === 'bestsellers') {
      whereClause.bestseller = true
    }

    let fetchedProducts = await prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: type === 'offers' ? 20 : 8,
      select: {
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
        variants: {
          select: {
            id: true,
            size: true,
            price: true,
            compareAtPrice: true,
            stock: true,
          },
        },
      },
    })

    if (type === 'offers') {
      fetchedProducts = fetchedProducts.filter((p: ProductRecord) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price))
      fetchedProducts = fetchedProducts.slice(0, 8) // Take top 8
    }

    products = fetchedProducts

  } catch (e) {
    console.error('Could not load products from DB', e)
  }

  // Map DB products to the shape ProductsClient expects
  const mapped = products.map((p) => ({
    id: p.slug,
    name: p.name,
    engName: p.brand || '',
    description: p.description || '',
    price: `${Number(p.price).toLocaleString('ar-SA')} ${currency}`,
    rawPrice: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    code: p.sku || p.id.slice(0, 8).toUpperCase(),
    color: p.category || '',
    size: p.size || '',
    gender: p.gender || '',
    gradient: 'from-brand/20 to-accent/20',
    image: p.imageUrl || '',
    images: p.images || [],
    stock: p.stock ?? 0,
    slug: p.slug,
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      size: v.size || '',
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stock: v.stock,
    })),
  }))

  if (mapped.length === 0) return null

  return <ProductsClient products={mapped} title={title} subtitle={subtitle} type={type} />
}
