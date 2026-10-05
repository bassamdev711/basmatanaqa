import { getBrandingSettings } from './actions'
import BrandingClient from './BrandingClient'

export const dynamic = 'force-dynamic'

export default async function BrandingPage() {
  const res = await getBrandingSettings()
  const settings = res.success ? res.settings : null

  return (
    <BrandingClient 
      initial={{
        ogImageUrl: settings?.ogImageUrl ?? null,
        faviconUrl: settings?.faviconUrl ?? null,
        storeUrl: settings?.storeUrl ?? null,
        storeName: settings?.storeName ?? null,
        storeNameLatin: settings?.storeNameLatin ?? null,
        storeTagline: settings?.storeTagline ?? null,
        storeDescription: settings?.storeDescription ?? null,
        logoUrl: settings?.logoUrl ?? null,
        locale: settings?.locale ?? 'ar',
        currencyCode: settings?.currencyCode ?? 'YER',
      }} 
    />
  )
}
