'use server'

import { verifyAdmin } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCollections() {
  await verifyAdmin();

  return prisma.collection.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCollection(data: { name: string, slug: string, description: string, isActive: boolean, imageUrl: string | null }) {
  await verifyAdmin();

  try {
    await prisma.collection.create({
      data
    })
    revalidatePath('/admin/collections')
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'الرابط الدائم (slug) مستخدم مسبقاً.' }
    }
    return { success: false, error: 'حدث خطأ أثناء إنشاء المجموعة.' }
  }
}

export async function deleteCollection(id: string) {
  await verifyAdmin();

  try {
    await prisma.collection.delete({ where: { id } })
    revalidatePath('/admin/collections')
    revalidatePath('/admin/products')
    return { success: true }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء حذف المجموعة.' }
  }
}

export async function toggleCollectionStatus(id: string, isActive: boolean) {
  await verifyAdmin();

  try {
    await prisma.collection.update({
      where: { id },
      data: { isActive }
    })
    revalidatePath('/admin/collections')
    return { success: true }
  } catch {
    return { success: false, error: 'حدث خطأ.' }
  }
}

export async function updateCollection(id: string, data: { name: string, slug: string, description: string, isActive: boolean, imageUrl: string | null }) {
  await verifyAdmin();

  try {
    await prisma.collection.update({
      where: { id },
      data
    })
    revalidatePath('/admin/collections')
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'الرابط الدائم (slug) مستخدم مسبقاً.' }
    }
    return { success: false, error: 'حدث خطأ أثناء تحديث المجموعة.' }
  }
}

export async function getSubCategories(collectionId: string) {
  await verifyAdmin();
  return prisma.subCategory.findMany({
    where: { collectionId, isActive: true },
    select: { id: true, name: true, slug: true, description: true, isActive: true, imageUrl: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createSubCategory(data: { name: string, slug: string, description: string, isActive: boolean, collectionId: string, imageUrl?: string | null }) {
  await verifyAdmin();
  try {
    await prisma.subCategory.create({ data });
    revalidatePath(`/admin/collections/${data.collectionId}`);
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'الرابط الدائم مستخدم مسبقاً.' };
    return { success: false, error: 'حدث خطأ' };
  }
}

export async function updateSubCategory(id: string, data: { name: string, slug: string, description: string, isActive: boolean, collectionId: string, imageUrl?: string | null }) {
  await verifyAdmin();
  try {
    await prisma.subCategory.update({ where: { id }, data });
    revalidatePath(`/admin/collections/${data.collectionId}`);
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'الرابط الدائم مستخدم مسبقاً.' };
    return { success: false, error: 'حدث خطأ' };
  }
}

export async function deleteSubCategory(id: string, collectionId: string) {
  await verifyAdmin();
  try {
    await prisma.subCategory.delete({ where: { id } });
    revalidatePath(`/admin/collections/${collectionId}`);
    revalidatePath('/admin/products');
    return { success: true };
  } catch {
    return { success: false, error: 'حدث خطأ. ربما يكون هناك منتجات مرتبطة بهذا التصنيف.' };
  }
}

/**
 * Fetch unassigned products for a given collection with pagination and optional search
 */
export async function getUnassignedProducts({
  collectionId,
  page = 1,
  limit = 20,
  search = '',
}: {
  collectionId: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  await verifyAdmin();

  const skip = (page - 1) * limit;

  const where: any = {
    collectionId: collectionId,
    subCategoryId: null,
  };

  if (search && search.trim()) {
    where.name = {
      contains: search.trim(),
      mode: 'insensitive',
    };
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    stock: p.stock,
  }));

  const hasMore = skip + products.length < totalCount;

  return {
    products: serializedProducts,
    totalCount,
    hasMore,
  };
}

/**
 * Bulk assign an array of product IDs to a given subCategory
 */
export async function bulkAssignProductsToSubCategory({
  productIds,
  subCategoryId,
  collectionId,
}: {
  productIds: string[];
  subCategoryId: string;
  collectionId: string;
}) {
  await verifyAdmin();

  if (!productIds || productIds.length === 0) {
    return { success: false, error: 'لم يتم تحديد أي منتجات.' };
  }

  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true, collectionId: true },
    });

    if (!subCategory || subCategory.collectionId !== collectionId) {
      return { success: false, error: 'المجموعة الفرعية المحددة غير صالحة.' };
    }

    const updated = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        collectionId: collectionId,
      },
      data: {
        subCategoryId: subCategoryId,
      },
    });

    revalidatePath(`/admin/collections/${collectionId}`);
    revalidatePath('/admin/products');

    return {
      success: true,
      count: updated.count,
    };
  } catch (error: any) {
    console.error('Error in bulkAssignProductsToSubCategory:', error);
    return { success: false, error: 'حدث خطأ أثناء ربط المنتجات.' };
  }
}
