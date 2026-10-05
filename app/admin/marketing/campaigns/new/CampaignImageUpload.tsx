'use client'

import { useState } from 'react'
import ImageUpload from '@/app/admin/products/ImageUpload'

export default function CampaignImageUpload({ name, defaultUrl = '' }: { name: string, defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl)

  return (
    <div className="mt-2">
      <input type="hidden" name={name} value={url} />
      <ImageUpload 
        mainImage={url} 
        onMainImageChange={setUrl} 
        singleOnly={true} 
      />
    </div>
  )
}
