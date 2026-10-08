import React from 'react'
import OffersClient from './OffersClient'
import { getOffers, getProducts } from './actions'

export const dynamic = 'force-dynamic'

export default async function OffersPage() {
  const [offers, products] = await Promise.all([
    getOffers(),
    getProducts()
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">عروض المنتجات المستقلة</h1>
        <p className="text-gray-500">قم بإدارة العروض التسويقية الخاصة بمنتجات معينة.</p>
      </div>

      <OffersClient initialOffers={offers} products={products} />
    </div>
  )
}
