import React from 'react'
import { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrackOrderClient from './TrackOrderClient'
import { getStoreConfig } from '@/lib/store-config'

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreConfig()
  return {
    title: `تتبع الطلب | ${store.name}`,
    description: `تتبع حالة طلبك من ${store.name} بكل سهولة`,
  }
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="flex-grow min-h-[60vh]" />}>
        <TrackOrderClient />
      </Suspense>
      <Footer />
    </main>
  )
}
