import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartClient from './CartClient'
import { Metadata } from 'next'
import { getStoreConfig } from '@/lib/store-config'
import prisma from '@/lib/prisma'

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreConfig()
  return { title: `السلة | ${store.name}` }
}

export default async function CartPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  const couponsEnabled = settings?.couponsEnabled ?? true

  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <Navbar />
      <CartClient couponsEnabled={couponsEnabled} />
      <Footer />
    </main>
  )
}
