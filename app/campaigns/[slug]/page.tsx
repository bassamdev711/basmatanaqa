import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CampaignBanner from '@/components/CampaignBanner'
import ProductsClient from '@/components/ProductsClient'
import { getCurrency } from '@/lib/currency'
import { getStoreConfig } from '@/lib/store-config'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [campaign, store] = await Promise.all([
    prisma.campaign.findUnique({ where: { slug } }),
    getStoreConfig(),
  ])
  if (!campaign) return { title: `حملة غير موجودة | ${store.name}` }
  return {
    title: `${campaign.title} | ${store.name}`,
    description: campaign.description || `عروض مميزة من ${store.name}`,
  }
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          variants: true
        }
      }
    }
  })

  if (!campaign || !campaign.isActive) {
    notFound()
  }

  const currency = await getCurrency()

  // Apply automatic discount if configured
  const applyDiscount = (price: number) => {
    if (!campaign.discountPercentage) return price
    return price - (price * (campaign.discountPercentage / 100))
  }

  const mappedProducts = campaign.products.map(p => {
    const rawPrice = Number(p.price)
    const discountedPrice = applyDiscount(rawPrice)
    // If discount applied, compareAtPrice is the raw original price
    const comparePrice = campaign.discountPercentage ? rawPrice : (p.compareAtPrice ? Number(p.compareAtPrice) : undefined)

    return {
      id: p.slug,
      name: p.name,
      engName: p.brand || '',
      description: p.description || '',
      price: `${discountedPrice.toLocaleString('ar-SA')} ${currency}`,
      rawPrice: discountedPrice,
      compareAtPrice: comparePrice,
      code: p.sku || p.id.slice(0, 8).toUpperCase(),
      color: p.category || '',
      size: p.size || '',
      gender: p.gender || '',
      gradient: 'from-blue-900/40 to-cyan-800/40',
      image: p.imageUrl || '',
      images: p.images || [],
      stock: p.stock ?? 0,
      slug: p.slug,
      variants: (p.variants || []).map((v) => {
        const vRaw = Number(v.price)
        const vDiscounted = applyDiscount(vRaw)
        return {
          id: v.id,
          size: v.size,
          price: vDiscounted,
          compareAtPrice: campaign.discountPercentage ? vRaw : (v.compareAtPrice ? Number(v.compareAtPrice) : null),
          stock: v.stock,
        }
      }),
    }
  })

  const campaignForBanner = {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    imageUrl: campaign.imageUrl,
    slug: null,
    endDate: campaign.endDate,
    discountPercentage: campaign.discountPercentage
  }

  return (
    <main className="min-h-screen bg-surface text-foreground overflow-hidden font-sans">
      <Navbar />
      
      <div className="pt-20">
        <CampaignBanner campaign={campaignForBanner} />
        
        {mappedProducts.length > 0 ? (
          <ProductsClient 
            products={mappedProducts} 
            title="منتجات الحملة" 
            subtitle="العروض الحصرية الخاصة بهذه الحملة" 
            type="offers" 
          />
        ) : (
          <div className="text-center py-24 text-gray-500">
            لا توجد منتجات مرتبطة بهذه الحملة حالياً.
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  )
}
