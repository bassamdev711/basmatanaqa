import type { MetadataRoute } from 'next'

function getBaseUrl(): string {
  try {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    if (!configuredUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')
    return new URL(configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`).origin
  } catch {
    return 'http://localhost:3000'
  }
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/cart',
        '/checkout',
        '/account',
        '/orders',
        '/track',
        '/_next',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
