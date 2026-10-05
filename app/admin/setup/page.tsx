import SetupClient from './SetupClient'
import { getStoreConfig } from '@/lib/store-config'

export const metadata = {
  title: 'تهيئة لوحة التحكم',
}

export default async function SetupPage() {
  const store = await getStoreConfig()

  return (
    <div className="min-h-screen pt-4 pb-20">
      <SetupClient storeName={store.name} />
    </div>
  )
}
