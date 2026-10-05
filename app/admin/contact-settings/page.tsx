import { getContactSettings } from './actions'
import ContactSettingsClient from './ContactSettingsClient'

export const metadata = {
  title: 'إعدادات التواصل | لوحة التحكم',
}

export default async function ContactSettingsPage() {
  const result = await getContactSettings()
  const initialData = result.success ? result.data ?? null : null

  return <ContactSettingsClient initialData={initialData} />
}
