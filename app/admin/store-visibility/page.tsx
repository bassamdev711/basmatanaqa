import prisma from '@/lib/prisma'
import StoreVisibilityClient from './StoreVisibilityClient'

export default async function StoreVisibilityPage() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: 'singleton' },
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تحسين ظهور المتجر</h1>
        <p className="text-gray-600">
          أخبرنا عن متجرك وما الذي تبيعه، وما العبارات التي تعتقد أن عملاءك يبحثون عنها، وسنتولى نحن تحسين ظهور متجرك ومنتجاتك.
        </p>
      </div>

      <StoreVisibilityClient 
        initialStoreName={settings?.storeName || ''} 
        initialStoreDescription={settings?.storeDescription || ''} 
        initialPhrases={settings?.seoSearchPhrases || []} 
      />
    </div>
  )
}
