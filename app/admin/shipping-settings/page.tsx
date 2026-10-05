import { getStoreSettings } from './actions'
import { getShippingCities } from '@/app/actions/shipping'
import ShippingSettingsClient from './ShippingSettingsClient'

export const dynamic = 'force-dynamic'

export default async function ShippingSettingsPage() {
  const [settings, citiesResult] = await Promise.all([
    getStoreSettings(),
    getShippingCities()
  ])
  
  const cities = citiesResult.success && citiesResult.data ? citiesResult.data.map(c => ({
    id: c.id,
    name: c.name,
    shippingFee: Number(c.shippingFee),
    isActive: c.isActive
  })) : []
  
  // Convert Decimals to numbers for client component
  const cleanSettings = {
    shippingFee: Number(settings.shippingFee),
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    showShippingInFooter: settings.showShippingInFooter,
    showReturnInFooter: settings.showReturnInFooter,
    shippingPolicyContent: settings.shippingPolicyContent || '',
    returnPolicyContent: settings.returnPolicyContent || '',
  }

  return <ShippingSettingsClient initialSettings={cleanSettings} initialCities={cities} />
}
