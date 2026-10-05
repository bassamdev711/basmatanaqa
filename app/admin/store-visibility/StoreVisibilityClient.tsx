'use client'

import { useToast } from '@/components/ToastProvider'

import { useState } from 'react'
import SeoOptimization from '@/components/admin/seo/SeoOptimization'
import { updateStoreVisibility } from './actions'

interface Props {
  initialStoreName: string;
  initialStoreDescription: string;
  initialPhrases: string[];
}

export default function StoreVisibilityClient({ initialStoreName, initialStoreDescription, initialPhrases }: Props) {
  const { showToast } = useToast()
  const [storeName, setStoreName] = useState(initialStoreName);
  const [storeDescription, setStoreDescription] = useState(initialStoreDescription);
  const [phrases, setPhrases] = useState<string[]>(initialPhrases);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form action={async (formData) => {
      setIsSaving(true);
      await updateStoreVisibility(formData);
      setIsSaving(false);
      showToast('success', 'تم حفظ الإعدادات بنجاح!');
    }} className="space-y-6">
      
      <input type="hidden" name="seoSearchPhrases" value={JSON.stringify(phrases)} />

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6 dir-rtl text-right">
        <h3 className="text-xl font-semibold text-gray-900 border-b pb-3">هوية المتجر</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input 
              type="text" 
              name="storeName" 
              required 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)}
              placeholder="مثال: متجر لمسة"
              className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ماذا يقدم متجرك؟</label>
            <textarea 
              name="storeDescription" 
              rows={4} 
              required
              value={storeDescription} 
              onChange={e => setStoreDescription(e.target.value)}
              placeholder="مثال: متجر يقدم منتجات مختارة بجودة عالية وخدمة موثوقة."
              className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none" 
            />
          </div>
        </div>
      </div>

      <SeoOptimization 
        title={storeName}
        description={storeDescription}
        hasImage={true} // Usually store has a logo
        initialPhrases={phrases}
        onPhrasesChange={setPhrases}
        entityType="store"
      />

      <div className="flex justify-end gap-3 pt-4">
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-6 py-3 bg-[#1a544a] text-white text-md font-medium rounded-md hover:bg-[#133e36] disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </form>
  )
}
