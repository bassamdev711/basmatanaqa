import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import EditProductClient from './EditProductClient'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()
  
  const collections = await prisma.collection.findMany({ orderBy: { createdAt: 'desc' } })
  const suppliers = await prisma.supplier.findMany({
    where: { OR: [{ isActive: true }, { id: product.supplierId ?? '' }] },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  
  const mainCategories = await prisma.mainCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <EditProductClient
      product={{
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice != null ? Number(product.costPrice) : null,
      }}
      collections={collections}
      suppliers={suppliers}
      mainCategories={mainCategories}
    />
  )
}
