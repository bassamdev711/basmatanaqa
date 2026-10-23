import type { MetadataRoute } from 'next'

function getBaseUrl(): string {
  return 'https://shahrazadstore.com'
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
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
