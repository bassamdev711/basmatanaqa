import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET: جلب المنتجات مرتبة من الأقدم إلى الأحدث مع الفلترة والتقسيم
 */
export async function GET(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const collectionId = searchParams.get('collectionId') || ''
  const subCategoryId = searchParams.get('subCategoryId') || ''
  const search = (searchParams.get('search') || '').trim()
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const skip = (page - 1) * limit

  const whereClause: Prisma.ProductWhereInput = {}

  if (collectionId) {
    whereClause.collectionId = collectionId
  }

  if (subCategoryId) {
    whereClause.OR = [
      { subCategoryId: subCategoryId },
      { subCategoryIds: { has: subCategoryId } },
    ]
  }

  if (search) {
    whereClause.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortCode: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      },
    ]
  }

  try {
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' }, // الأقدم أولاً دائماً للتنظيف
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          shortCode: true,
          price: true,
          stock: true,
          imageUrl: true,
          createdAt: true,
          collection: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ])

    const hasMore = skip + products.length < totalCount

    return NextResponse.json({
      success: true,
      products,
      totalCount,
      page,
      hasMore,
    })
  } catch (error: any) {
    console.error('Error fetching products for cleanup:', error)
    return NextResponse.json({ success: false, error: 'فشل جلب المنتجات' }, { status: 500 })
  }
}

/**
 * DELETE: حذف منتج واحد أو مجموعة منتجات دفعة واحدة في الخلفية بصمت
 */
export async function DELETE(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
  }

  const ids: string[] = Array.isArray(payload?.ids)
    ? payload.ids.filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0)
    : typeof payload?.id === 'string' && payload.id.trim()
      ? [payload.id.trim()]
      : []

  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: 'لم يتم تحديد أي منتج للحذف' }, { status: 400 })
  }

  try {
    const deleteResult = await prisma.product.deleteMany({
      where: { id: { in: ids } },
    })

    // تحديث كاش الصفحات في الخلفية دون إعادة تحميل صفحة الأدمن الحالية
    try {
      revalidatePath('/products')
      revalidatePath('/')
      revalidateTag('products', 'max')
    } catch (revalidateErr) {
      console.warn('Revalidation warning:', revalidateErr)
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      deletedIds: ids,
    })
  } catch (err: any) {
    console.error('Error deleting products:', err)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف المنتجات. قد تكون بعض المنتجات مرتبطة ببيانات أخرى.' },
      { status: 500 }
    )
  }
}
