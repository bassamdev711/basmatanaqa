import Image from 'next/image'
import Link from 'next/link'
import { Plus, Edit, ExternalLink, Zap } from 'lucide-react'
import prisma from '@/lib/prisma'
import DeleteButton from './DeleteButton'
import CollectionFilter from './CollectionFilter'
import SubCategoryAssignButton from './SubCategoryAssignButton'
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
  searchParams: Promise<{ page?: string; collectionId?: string }>
}) {
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const selectedCollectionId = searchParamsResolved.collectionId || '';
  const limit = 50;
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ProductWhereInput = {};
  if (selectedCollectionId) {
    whereClause.collectionId = selectedCollectionId;
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

  const paginationCollectionQuery = selectedCollectionId ? `&collectionId=${selectedCollectionId}` : '';

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
            selectedCollectionId={selectedCollectionId}
          />
          <Link 
            href="/admin/products/bulk"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-gray-950 text-sm font-black rounded-md hover:bg-amber-400 shrink-0 shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 fill-gray-950" />
            إضافة متعددة ⚡
          </Link>
          <Link 
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الصورة
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المنتج
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المجموعة الفرعية
                </th>
                {/* Actions placed directly after SubCategory */}
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المخزون
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المجموعة
                </th>
                {/* Brand Column hidden on mobile */}
                <th scope="col" className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الماركة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                    لا توجد منتجات مطابقة لهذا الفلتر أو لم يتم إضافة منتجات بعد.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="w-10 h-10 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-[10px] text-gray-400 font-bold">بدون</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5 line-clamp-1" dir="ltr">/{product.slug}</div>
                    </td>
                    {/* 3rd Column: SubCategory Modal Button */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <SubCategoryAssignButton
                        productId={product.id}
                        productName={product.name}
                        collection={product.collection}
                        currentSubCategory={product.subCategory}
                        availableSubCategories={subCategories}
                      />
                    </td>
                    {/* Actions cell */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          href={`/admin/products/${product.id}/edit`} 
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="تعديل المنتج"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteButton id={product.id} />
                        <Link 
                          href={`/products/${product.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="معاينة في المتجر"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold" dir="ltr">
                      {Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <span className={`font-semibold ${product.stock <= 3 ? 'text-red-600 font-bold' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.isActive ? 'فعال' : 'غير فعال'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {product.collection?.name ? (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                          {product.collection.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {/* Brand cell hidden on mobile */}
                    <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {product.brand || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalCount > limit && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              صفحة {page} من {Math.ceil(totalCount / limit)} ({totalCount} منتج)
            </span>
            <div className="flex gap-2">
              <Link
                href={`/admin/products?page=${page - 1}${paginationCollectionQuery}`}
                className={`px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                السابق
              </Link>
              <Link
                href={`/admin/products?page=${page + 1}${paginationCollectionQuery}`}
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
