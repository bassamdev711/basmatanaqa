import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getCurrency } from '@/lib/currency'
import ProductCard from '@/components/ProductCard'
import CategoryFilterChips from '@/components/CategoryFilterChips'
import { getSiteUrl, getStoreConfig } from '@/lib/store-config'

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreConfig()
  const siteUrl = getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || store.storeUrl)
  return {
    title: `المنتجات | ${store.name}`,
    description: `تصفح منتجات ${store.name}: ملابس، أحذية، حقائب، إكسسوارات، عطور، تجميل، عناية وجمال وهدايا.`,
    keywords: ['منتجات بصمة أناقة', 'ملابس', 'أحذية', 'حقائب', 'إكسسوارات', 'عطور', 'تجميل', 'هدايا'],
    alternates: { canonical: new URL('/products', siteUrl).toString() },
    openGraph: {
      title: `المنتجات | ${store.name}`,
      description: `تصفح منتجات ${store.name} المختارة بعناية.`,
      url: new URL('/products', siteUrl).toString(),
      siteName: store.name,
      type: 'website',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>
}) {
  const currency = await getCurrency()

  const { collection } = await searchParams
  let products: Array<{
    id: string
    slug: string
    name: string
    brand: string | null
    price: unknown
    compareAtPrice: unknown
    imageUrl: string | null
    featured: boolean
  }> = []
  let dbCollections: Array<{ name: string; slug: string; imageUrl: string | null }> = []
  let dataLoadFailed = false

  try {
    // جلب الحقول الأساسية فقط — لا حاجة للوصف أو الصور المتعددة في القائمة
    products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        ...(collection ? { collection: { slug: collection } } : {}),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        price: true,
        compareAtPrice: true,
        imageUrl: true,
        featured: true,
      },
    })

    // جلب التصنيفات النشطة للفلاتر
    dbCollections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Failed to load products page data:', error)
    dataLoadFailed = true
  }

  // قائمة الروابط للـ Chips في الديسكتوب
  const chipFilters = [
    { label: 'الكل', href: '/products', imageUrl: null },
    ...dbCollections.map(c => ({
      label: c.name,
      href: `/products?collection=${c.slug}`,
      imageUrl: c.imageUrl
    }))
  ]

  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <Navbar />

      <div className="flex-grow pt-16 md:pt-20 pb-24 relative">
        {/* Quick Filter Chips — Responsive & Sticky */}
        <CategoryFilterChips filters={chipFilters} activeCollection={collection} />

        {/* Product Grid */}
        <section className="px-3 md:px-12 max-w-7xl mx-auto">
          {dataLoadFailed ? (
            <div className="text-center py-20 text-foreground/60 text-lg">
              تعذر تحميل المنتجات حالياً. يرجى تحديث الصفحة والمحاولة لاحقاً.
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-foreground/50 text-lg">
              لا توجد منتجات في هذه المجموعة حالياً
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
              {products.map((product, index) => (
                <ProductCard 
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: Number(product.price),
                    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                    imageUrl: product.imageUrl || '',
                    brand: product.brand || undefined,
                  }}
                  currency={currency}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}
