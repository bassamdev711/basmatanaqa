import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

type SitemapRecord = { slug: string; updatedAt: Date }

function getBaseUrl(): string {
  try {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    if (!configuredUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')
    return new URL(configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`).origin
  } catch {
    return 'http://localhost:3000'
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })

    const productUrls = products.map((product: SitemapRecord) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

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
