import prisma from '@/lib/prisma'
import CleanupClient from './CleanupClient'

export const dynamic = 'force-dynamic'

export default async function CleanupPage() {
  const [collections, subCategories] = await Promise.all([
    prisma.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.subCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, collectionId: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <CleanupClient
      initialCollections={collections}
      initialSubCategories={subCategories}
    />
  )
}
