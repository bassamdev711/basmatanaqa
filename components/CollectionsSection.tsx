import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

type CollectionCard = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
}

// Caching to improve speed
export const revalidate = 3600 // revalidate every hour

export default async function CollectionsSection({ brandName = 'بصمة أناقة' }: { brandName?: string }) {
  let collections: CollectionCard[] = []
  
  try {
    collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    })
  } catch (error) {
    console.error('Failed to load collections:', error)
  }

  if (collections.length === 0) return null

  return (
    <section className="py-12 md:py-24 bg-surface" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-4">
          <div>
            <span className="text-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block">
              تصنيفات {brandName}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground">استكشف التصنيفات</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-brand font-bold border-b border-brand/30 hover:border-brand transition-colors pb-1">
            جميع المنتجات <ArrowLeft size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {collections.map((collection) => (
            <Link 
              key={collection.id} 
              href={`/products?collection=${collection.slug}`}
              className="group relative h-[140px] sm:h-[180px] md:h-[400px] overflow-hidden rounded-xl md:rounded-3xl bg-surface/50 border border-black/5 shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              {collection.imageUrl ? (
                <Image 
                  src={collection.imageUrl} 
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 md:group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-brand/5 flex items-center justify-center">
                  <span className="text-brand font-black text-xl md:text-3xl opacity-20">{brandName}</span>
                </div>
              )}
              
              {/* Subtle gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-8">
                <h3 className="text-sm sm:text-base md:text-2xl font-bold text-white mb-0.5 md:mb-2 md:group-hover:-translate-y-2 transition-transform duration-300">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-white/80 text-[10px] md:text-sm line-clamp-1 md:line-clamp-2 md:opacity-0 md:group-hover:opacity-100 md:group-hover:-translate-y-2 transition-all duration-300 delay-75">
                    {collection.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
