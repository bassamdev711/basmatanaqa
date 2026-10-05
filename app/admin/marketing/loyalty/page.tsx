import { Metadata } from 'next'
import { getLoyaltySettings } from './actions'
import LoyaltySettingsClient from './LoyaltySettingsClient'

export const metadata: Metadata = {
  title: 'إعدادات نقاط الولاء | لوحة التحكم',
  description: 'إدارة نظام نقاط الولاء والمكافآت',
}

export default async function LoyaltySettingsPage() {
  const settings = await getLoyaltySettings()

  return (
    <div className="py-6">
      <LoyaltySettingsClient settings={settings} />
    </div>
  )
}
