import Image from 'next/image'
import Link from 'next/link'
import { Plus, Edit, ExternalLink, Zap } from 'lucide-react'
import prisma from '@/lib/prisma'
import DeleteButton from './DeleteButton'
import CollectionFilter from './CollectionFilter'
import SubCategoryAssignButton from './SubCategoryAssignButton'
import ProductsTableClient from './ProductsTableClient'
import { Prisma } from '@prisma/client'

type ProductRow = {
  id: string
  name: string
  slug: string
  brand: string | null
  price: Prisma.Decimal
  stock: number
  isActive: boolean
  imageUrl: string | null
  collection?: { id: string; name: string } | null
  subCategory?: { id: string; name: string } | null
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; collectionId?: string; subCategoryId?: string }>
}) {
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const selectedCollectionId = searchParamsResolved.collectionId || '';
  const selectedSubCategoryId = searchParamsResolved.subCategoryId || '';
  const limit = 50;
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ProductWhereInput = {};
  if (selectedCollectionId) {
    whereClause.collectionId = selectedCollectionId;
  }
  if (selectedSubCategoryId) {
    whereClause.OR = [
      { subCategoryId: selectedSubCategoryId },
      { subCategoryIds: { has: selectedSubCategoryId } },
    ];
  }

  let products: ProductRow[] = []
  let totalCount = 0;
  let collections: { id: string; name: string }[] = []
  let subCategories: { id: string; name: string; collectionId: string }[] = []
  
  try {
    const [fetchedProducts, count, fetchedCollections, fetchedSubCategories] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          collection: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where: whereClause }),
      prisma.collection.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.subCategory.findMany({
        select: { id: true, name: true, collectionId: true },
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    products = fetchedProducts;
    totalCount = count;
    collections = fetchedCollections;
    subCategories = fetchedSubCategories;
  } catch (error) {
    console.error("Database connection error:", error)
  }

  const paginationFilterQuery = `${selectedCollectionId ? `&collectionId=${selectedCollectionId}` : ''}${selectedSubCategoryId ? `&subCategoryId=${selectedSubCategoryId}` : ''}`;

  const currentReturnQuery = `${page > 1 ? `page=${page}` : ''}${selectedCollectionId ? `&collectionId=${selectedCollectionId}` : ''}${selectedSubCategoryId ? `&subCategoryId=${selectedSubCategoryId}` : ''}`.replace(/^&/, '');
  const currentReturnUrl = `/admin/products${currentReturnQuery ? `?${currentReturnQuery}` : ''}`;

  return (
    <div className="space-y-6">
      {/* Top Header: Title, Collection Filter, Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">المنتجات</h2>
          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-bold">
            {totalCount} منتج
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <CollectionFilter
            collections={collections}
            subCategories={subCategories}
            selectedCollectionId={selectedCollectionId}
            selectedSubCategoryId={selectedSubCategoryId}
          />
          <Link 
            href="/admin/products/bulk"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-gray-950 text-sm font-black rounded-md hover:bg-amber-400 shrink-0 shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 fill-gray-950" />
            إضافة متعددة
          </Link>
          <Link 
            href={`/admin/products/new?returnUrl=${encodeURIComponent(currentReturnUrl)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ProductsTableClient 
          products={products}
          subCategories={subCategories}
        />
        
        {/* Pagination Controls */}
        {totalCount > limit && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              صفحة {page} من {Math.ceil(totalCount / limit)} ({totalCount} منتج)
            </span>
            <div className="flex gap-2">
              <Link
                href={`/admin/products?page=${page - 1}${paginationFilterQuery}`}
                className={`px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                السابق
              </Link>
              <Link
                href={`/admin/products?page=${page + 1}${paginationFilterQuery}`}
                className={`px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 ${page >= Math.ceil(totalCount / limit) ? 'pointer-events-none opacity-50' : ''}`}
              >
                التالي
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
