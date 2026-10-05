import { cache } from 'react'
import prisma from '@/lib/prisma'

export type StoreConfig = {
  name: string
  nameLatin: string
  tagline: string
  description: string
  logoUrl: string | null
  faviconUrl: string | null
  ogImageUrl: string | null
  storeUrl: string | null
  locale: string
  currencyCode: string
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'بصمة أناقة',
  nameLatin: 'BASMAT ANAQAH',
  tagline: 'اختيارات تصنع حضورك.',
  description: 'اكتشف تشكيلة متنوعة من المنتجات المختارة بعناية، مع تجربة تسوق راقية وواضحة وآمنة.',
  logoUrl: 'https://raw.githubusercontent.com/bassamdev711/basmatanaqa/main/basmat-anaqah-logo.png',
  faviconUrl: '/basmat-anaqah-logo.png',
  ogImageUrl: null,
  storeUrl: null,
  locale: 'ar',
  currencyCode: 'USD',
}

type StoreSettingsRecord = {
  storeName: string | null
  storeNameLatin: string | null
  storeTagline: string | null
  storeDescription: string | null
  logoUrl: string | null
  faviconUrl: string | null
  ogImageUrl: string | null
  storeUrl: string | null
  locale: string
  currencyCode: string
}

function normalizeStoreConfig(settings: StoreSettingsRecord | null | undefined): StoreConfig {
  const storedName = settings?.storeName?.trim()
  const storedLatin = settings?.storeNameLatin?.trim()
  const isLegacyBrand = !storedName || ['طيف', 'TIF', 'متجرك'].includes(storedName) || ['YOUR STORE', 'TIF'].includes(storedLatin || '')
  return {
    ...DEFAULT_STORE_CONFIG,
    name: isLegacyBrand ? DEFAULT_STORE_CONFIG.name : storedName!,
    nameLatin: isLegacyBrand ? DEFAULT_STORE_CONFIG.nameLatin : storedLatin!,
    tagline: isLegacyBrand ? DEFAULT_STORE_CONFIG.tagline : (settings?.storeTagline?.trim() || DEFAULT_STORE_CONFIG.tagline),
    description: isLegacyBrand ? DEFAULT_STORE_CONFIG.description : (settings?.storeDescription?.trim() || DEFAULT_STORE_CONFIG.description),
    logoUrl: settings?.logoUrl || null,
    faviconUrl: settings?.faviconUrl || null,
    ogImageUrl: settings?.ogImageUrl || null,
    storeUrl: settings?.storeUrl || null,
    locale: settings?.locale || DEFAULT_STORE_CONFIG.locale,
    currencyCode: settings?.currencyCode || DEFAULT_STORE_CONFIG.currencyCode,
  }
}

export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
      select: {
        storeName: true,
        storeNameLatin: true,
        storeTagline: true,
        storeDescription: true,
        logoUrl: true,
        faviconUrl: true,
        ogImageUrl: true,
        storeUrl: true,
        locale: true,
        currencyCode: true,
      },
    })

    return normalizeStoreConfig(settings)
  } catch {
    return DEFAULT_STORE_CONFIG
  }
})

export function getSiteUrl(storeUrl?: string | null): URL {
  const candidate = storeUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example-store.vercel.app'
  try {
    return new URL(candidate)
  } catch {
    return new URL('https://example-store.vercel.app')
  }
}
