import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

type SitemapRecord = { slug: string; updatedAt: Date }

function getBaseUrl(): string {
  return 'https://shahrazadstore.com'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  try {
    const productUrls: MetadataRoute.Sitemap = []
    let cursor: string | undefined = undefined
    const BATCH_SIZE = 2000

    while (true) {
      const batch = (await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
        take: BATCH_SIZE,
        skip: cursor ? 1 : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      })) as { id: string, slug: string, updatedAt: Date }[]
      if (batch.length === 0) break

      const mapped = batch.map((product: { id: string, slug: string, updatedAt: Date }) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
      
      productUrls.push(...mapped)
      cursor = batch[batch.length - 1].id
      if (productUrls.length >= 40000) break // Guard against extreme sizes
    }

    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })

    const collectionUrls = collections.map((collection: SitemapRecord) => ({
      url: `${baseUrl}/products?collection=${encodeURIComponent(collection.slug)}`,
      lastModified: collection.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

    const pages = await prisma.legalPage.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })

    const pageUrls = pages.map((page: SitemapRecord) => ({
      url: `${baseUrl}/pages/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

    const routes = [
      { route: '', priority: 1, changeFrequency: 'daily' as const },
      { route: '/products', priority: 0.9, changeFrequency: 'daily' as const },
      { route: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
      { route: '/policies/shipping', priority: 0.4, changeFrequency: 'monthly' as const },
      { route: '/policies/return', priority: 0.4, changeFrequency: 'monthly' as const },
    ].map(({ route, priority, changeFrequency }) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))

    return [...routes, ...collectionUrls, ...productUrls, ...pageUrls]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ]
  }
}
