import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getCurrency } from '@/lib/currency'
import ProductCard from '@/components/ProductCard'
import CategoryFilterChips from '@/components/CategoryFilterChips'
import { getSiteUrl, getStoreConfig } from '@/lib/store-config'
import ProductDiscoveryFilters from '@/components/ProductDiscoveryFilters'
import PaginationControls from '@/components/PaginationControls'
import { Prisma } from '@prisma/client'

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
  searchParams: Promise<{ collection?: string; subcategory?: string; page?: string; sort?: string; minPrice?: string; maxPrice?: string; brand?: string }>
}) {
  const searchParamsResolved = await searchParams;
  const collection = searchParamsResolved.collection;
  const subcategory = searchParamsResolved.subcategory;
  
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const pageSize = 12;
  
  const sort = searchParamsResolved.sort || 'newest';
  const minPrice = searchParamsResolved.minPrice ? parseFloat(searchParamsResolved.minPrice) : undefined;
  const maxPrice = searchParamsResolved.maxPrice ? parseFloat(searchParamsResolved.maxPrice) : undefined;
  const brands = searchParamsResolved.brand ? searchParamsResolved.brand.split(',') : [];

  const currency = await getCurrency()
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
  let dbSubCategories: Array<{ name: string; slug: string; imageUrl: string | null }> = []
  let dataLoadFailed = false
  let totalCount = 0;
  let availableBrands: string[] = [];

  try {
    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
      stock: { gt: 0 },
      ...(collection ? { collection: { slug: collection } } : {}),
      ...(subcategory ? { subCategory: { slug: subcategory } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined ? {
         price: {
           ...(minPrice !== undefined ? { gte: minPrice } : {}),
           ...(maxPrice !== undefined ? { lte: maxPrice } : {})
         }
      } : {}),
      ...(brands.length > 0 ? { brand: { in: brands } } : {})
    };

    let orderByClause: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [{ featured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'price_asc') {
      orderByClause = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderByClause = { price: 'desc' };
    } else if (sort === 'newest') {
      orderByClause = { createdAt: 'desc' };
    }

    const [productsResult, countResult] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
      prisma.product.count({ where: whereClause })
    ]);
    
    products = productsResult;
    totalCount = countResult;

    // fetch distinct brands for filters
    const distinctBrandsResult = await prisma.product.findMany({
      where: { 
        isActive: true, 
        stock: { gt: 0 },
        ...(collection ? { collection: { slug: collection } } : {}),
        ...(subcategory ? { subCategory: { slug: subcategory } } : {})
      },
      select: { brand: true },
      distinct: ['brand']
    });
    availableBrands = distinctBrandsResult.map(b => b.brand).filter(Boolean) as string[];

    dbCollections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (collection) {
      dbSubCategories = await prisma.subCategory.findMany({
        where: { isActive: true, collection: { slug: collection } },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      dbSubCategories = await prisma.subCategory.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
    }
  } catch (error) {
    console.error('Failed to load products page data:', error)
    dataLoadFailed = true
  }

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
        <div className="flex flex-col border-b border-black/5 bg-surface/95 backdrop-blur-md sticky top-14 md:top-[68px] z-40">
          <CategoryFilterChips filters={chipFilters} activeSlug={collection} paramKey="collection" />
          
          {dbSubCategories.length > 0 && (
            <CategoryFilterChips 
              filters={[
                { label: 'الكل', href: collection ? `/products?collection=${collection}` : '/products', imageUrl: null },
                ...dbSubCategories.map(sub => ({
                  label: sub.name,
                  href: collection ? `/products?collection=${collection}&subcategory=${sub.slug}` : `/products?subcategory=${sub.slug}`,
                  imageUrl: sub.imageUrl
                }))
              ]}
              activeSlug={subcategory} 
              paramKey="subcategory"
              variant="pills"
            />
          )}
        </div>

        <ProductDiscoveryFilters totalProducts={totalCount} availableBrands={availableBrands} />

        <section className="px-3 md:px-12 max-w-7xl mx-auto">
          {dataLoadFailed ? (
            <div className="text-center py-20 text-foreground/60 text-lg">
              تعذر تحميل المنتجات حالياً. يرجى تحديث الصفحة والمحاولة لاحقاً.
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-foreground/50 text-lg">
              لا توجد منتجات مطابقة للبحث أو الفلاتر الحالية
            </div>
          ) : (
            <>
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
              <PaginationControls currentPage={page} totalPages={Math.ceil(totalCount / pageSize)} />
            </>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}
