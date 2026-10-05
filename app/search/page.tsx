import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getCurrency } from '@/lib/currency'
import { Prisma } from '@prisma/client'

type SearchProduct = {
  id: string
  name: string
  slug: string
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  imageUrl: string | null
  category: string | null
}

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const currency = await getCurrency()

  const query = searchParams.q || ''
  
  let products: SearchProduct[] = []
  let dataLoadFailed = false
  
  if (query) {
    try {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { seoSearchPhrases: { hasSome: [query, query.trim(), query.toLowerCase()] } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          imageUrl: true,
          category: true
        }
      })
    } catch (error) {
      console.error('Failed to load search results:', error)
      dataLoadFailed = true
    }
  }

  return (
    <main className="min-h-screen bg-surface text-foreground flex flex-col font-sans" dir="rtl">
      <Navbar />

      <div className="flex-grow pt-32 pb-24 px-6 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            {query ? `نتائج البحث عن "${query}"` : 'البحث'}
          </h1>
          <p className="text-foreground/60">
            {query ? `وجدنا ${products.length} نتيجة مطابقة لبحثك.` : 'اكتب ما تبحث عنه لاكتشاف منتجاتنا.'}
          </p>
        </div>

        {!query ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Search className="w-16 h-16 text-foreground mb-6" />
            <p className="text-xl font-bold">استخدم أيقونة البحث في الأعلى للبدء</p>
          </div>
        ) : dataLoadFailed ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-black/5 rounded-3xl">
            <Search className="w-16 h-16 text-foreground/20 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">تعذر تحميل نتائج البحث</h2>
            <p className="text-foreground/60 text-center max-w-md">يرجى تحديث الصفحة والمحاولة لاحقاً.</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/products/${product.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[4/5] bg-white border border-black/5 rounded-2xl overflow-hidden mb-4 p-6">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name}
                      fill
                      className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-accent text-2xl">متجرنا</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-grow">
                  <div className="text-xs text-accent font-bold tracking-widest mb-2 uppercase">
                    {product.category || 'منتجات'}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-brand transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-brand font-bold">{Number(product.price).toLocaleString('ar-SA')} {currency}</span>
                      {product.compareAtPrice && (
                        <span className="text-foreground/40 line-through text-sm">
                          {Number(product.compareAtPrice).toLocaleString('ar-SA')} {currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-black/5 rounded-3xl">
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
