import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getCurrency } from '@/lib/currency'
import { Prisma } from '@prisma/client'
import { getArabicSearchVariations } from '@/lib/search-utils'
import ProductDiscoveryFilters from '@/components/ProductDiscoveryFilters'
import PaginationControls from '@/components/PaginationControls'
import ProductCard from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; minPrice?: string; maxPrice?: string; brand?: string }>
}) {
  const searchParamsResolved = await searchParams;
  const currency = await getCurrency()

  const query = searchParamsResolved.q || ''
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const pageSize = 12;
  
  const sort = searchParamsResolved.sort || 'newest';
  const minPrice = searchParamsResolved.minPrice ? parseFloat(searchParamsResolved.minPrice) : undefined;
  const maxPrice = searchParamsResolved.maxPrice ? parseFloat(searchParamsResolved.maxPrice) : undefined;
  const brands = searchParamsResolved.brand ? searchParamsResolved.brand.split(',') : [];

  let products: any[] = []
  let totalCount = 0
  let availableBrands: string[] = []
  let dataLoadFailed = false
  
  if (query) {
    try {
      const variations = getArabicSearchVariations(query);
      
      // Build a nested OR for variations
      const searchConditions = variations.map(v => ({
        OR: [
          { name: { contains: v, mode: 'insensitive' as const } },
          { brand: { contains: v, mode: 'insensitive' as const } },
          { category: { contains: v, mode: 'insensitive' as const } },
          { seoSearchPhrases: { hasSome: [v, v.toLowerCase()] } }
        ]
      }));

      const whereClause: Prisma.ProductWhereInput = {
        isActive: true,
        stock: { gt: 0 },
        ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
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
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            imageUrl: true,
            brand: true
          }
        }),
        prisma.product.count({ where: whereClause })
      ]);
      products = productsResult;
      totalCount = countResult;

      const distinctBrandsResult = await prisma.product.findMany({
        where: { 
          isActive: true, 
          stock: { gt: 0 },
          ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
        },
        select: { brand: true },
        distinct: ['brand']
      });
      availableBrands = distinctBrandsResult.map(b => b.brand).filter(Boolean) as string[];

    } catch (error) {
      console.error('Failed to load search results:', error)
      dataLoadFailed = true
    }
  }

  return (
    <main className="min-h-screen bg-surface text-foreground flex flex-col font-sans" dir="rtl">
      <Navbar />

      <div className="flex-grow pt-32 pb-24 relative">
        <div className="mb-10 text-center px-6">
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            {query ? `نتائج البحث عن "${query}"` : 'البحث'}
          </h1>
          <p className="text-foreground/60">
            {query ? `وجدنا ${totalCount} نتيجة مطابقة لبحثك.` : 'اكتب ما تبحث عنه لاكتشاف منتجاتنا.'}
          </p>
        </div>

        {!query ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 px-6">
            <Search className="w-16 h-16 text-foreground mb-6" />
            <p className="text-xl font-bold">استخدم أيقونة البحث في الأعلى للبدء</p>
          </div>
        ) : dataLoadFailed ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-black/5 rounded-3xl mx-6">
            <Search className="w-16 h-16 text-foreground/20 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">تعذر تحميل نتائج البحث</h2>
            <p className="text-foreground/60 text-center max-w-md">يرجى تحديث الصفحة والمحاولة لاحقاً.</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductDiscoveryFilters totalProducts={totalCount} availableBrands={availableBrands} />
            <div className="px-3 md:px-12 max-w-7xl mx-auto w-full">
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
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-black/5 rounded-3xl mx-6 max-w-3xl md:mx-auto">
            <Filter className="w-16 h-16 text-foreground/20 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">لم نجد أي نتائج!</h2>
            <p className="text-foreground/60 text-center max-w-md mb-8">
              لم نتمكن من العثور على أي منتج يطابق &quot;{query}&quot;. يرجى التأكد من الكلمات المستخدمة أو تجربة كلمات أخرى.
            </p>
            <Link 
              href="/products"
              className="bg-foreground text-surface px-8 py-3 rounded-none font-bold hover:bg-brand transition-colors inline-flex items-center gap-2"
            >
              تصفح جميع المنتجات
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
