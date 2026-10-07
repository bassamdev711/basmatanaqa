import React from 'react'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import SubCategoriesClient from './SubCategoriesClient'

export const dynamic = 'force-dynamic'

export default async function CollectionSubcategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { subCategories: true }
  })

  if (!collection) {
    notFound()
  }

  return <SubCategoriesClient collection={collection} />
}
