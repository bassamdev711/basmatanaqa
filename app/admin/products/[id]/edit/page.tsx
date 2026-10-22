import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import EditProductClient from './EditProductClient'

export default async function EditProductPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>
  searchParams?: Promise<{ returnUrl?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()
  
  const [collections, suppliers, initialSubCategories] = await Promise.all([
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({
      where: { OR: [{ isActive: true }, { id: product.supplierId ?? '' }] },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    product.collectionId 
      ? prisma.subCategory.findMany({
          where: { collectionId: product.collectionId, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  const initialSubCatIds = product.subCategoryIds && product.subCategoryIds.length > 0
    ? product.subCategoryIds
    : (product.subCategoryId ? [product.subCategoryId] : [])

  return (
    <EditProductClient
      product={{
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice != null ? Number(product.costPrice) : null,
        subCategoryIds: initialSubCatIds,
      }}
      collections={collections}
      suppliers={suppliers}
      initialSubCategories={initialSubCategories}
      returnUrl={resolvedSearchParams.returnUrl || ''}
    />
  )
}
