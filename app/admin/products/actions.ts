// app/admin/products/actions.ts

'use server';
import prisma from '@/lib/prisma';
import { putTrackedBlob } from '@/lib/usage';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { verifyAdmin } from '@/lib/auth';
import { getUniqueProductSlug, slugify, generateRandomSuffix } from '@/lib/slug';

const isNextRedirectError = (err: any) => err && typeof err === 'object' && 'digest' in err && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT');

/**
 * Server Action to create a new product.
 * Receives the form data from the client component, uploads the main image to Vercel Blob
 * (if an image URL is provided), stores the product in the database and revalidates the
 * product list page so the new product appears instantly.
 */
export async function createProduct(formData: FormData) {
  await verifyAdmin();

  try {
    // Extract fields
    const name = (formData.get('name') as string)?.trim();
    let rawSlug = (formData.get('slug') as string)?.trim();
    if (!rawSlug && name) {
      rawSlug = name;
    }
    const slug = await getUniqueProductSlug(rawSlug || name);
    const brand = formData.get('brand') as string | null;
    const collectionId = formData.get('collectionId') as string | null;
    const supplierId = formData.get('supplierId') as string | null;
    const costPrice = formData.get('costPrice') ? Number(formData.get('costPrice')) : null;
    const gender = formData.get('gender') as string | null;
    const size = formData.get('size') as string | null;
    const description = formData.get('description') as string | null;
    const price = Number(formData.get('price'));
    const compareAtPrice = formData.get('compareAtPrice')
      ? Number(formData.get('compareAtPrice'))
      : null;
    const sku = formData.get('sku') as string | null;
    const stock = Number(formData.get('stock'));
    const isActive = formData.get('isActive') === 'on';
    const featured = formData.get('featured') === 'on';
    const bestseller = formData.get('bestseller') === 'on';
    const imageUrl = formData.get('imageUrl') as string | null;
    const extraImages = JSON.parse((formData.get('images') as string) || '[]');
    const seoSearchPhrases = JSON.parse((formData.get('seoSearchPhrases') as string) || '[]');
    const seoScore = formData.get('seoScore') ? Number(formData.get('seoScore')) : null;
    
    const rawSubCategoryIds = formData.getAll('subCategoryIds') as string[];
    let subCategoryId = formData.get('subCategoryId') as string | null;
    let subCategoryIds = rawSubCategoryIds.filter(Boolean);
    if (subCategoryId && !subCategoryIds.includes(subCategoryId)) {
      subCategoryIds.unshift(subCategoryId);
    }
    if (!subCategoryId && subCategoryIds.length > 0) {
      subCategoryId = subCategoryIds[0];
    }

    const hasSizes = formData.get('hasSizes') === 'true';
    const availableSizes = JSON.parse((formData.get('availableSizes') as string) || '[]');
    const addAnother = formData.get('addAnother') === 'true';

    if (collectionId && subCategoryIds.length > 0) {
      const validSubCats = await prisma.subCategory.findMany({
        where: { id: { in: subCategoryIds }, collectionId },
        select: { id: true },
      });
      if (validSubCats.length !== subCategoryIds.length) {
        throw new Error('INVALID_SUBCATEGORY');
      }
    }

    // Upload main image to Vercel Blob if a URL is provided
    let storedImageUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('https://')) {
      const file = await fetch(imageUrl).then((r) => r.blob());
      const filename = `products/${Date.now()}-main-${Math.random().toString(36).slice(2)}.webp`;
      const { url } = await putTrackedBlob(filename, file, { access: 'public' }, 'product', file.size);
      storedImageUrl = url;
    }

    // Upload additional images
    const storedExtraImages: string[] = [];
    for (const img of extraImages) {
      if (img && typeof img === 'string') {
        if (img.startsWith('https://')) {
          storedExtraImages.push(img);
        } else {
          const file = await fetch(img).then((r) => r.blob());
          const filename = `products/${Date.now()}-extra-${Math.random().toString(36).slice(2)}.webp`;
          const { url } = await putTrackedBlob(filename, file, { access: 'public' }, 'product', file.size);
          storedExtraImages.push(url);
        }
      }
    }

    let product;
    try {
      product = await prisma.product.create({
        data: {
          name,
          slug,
          brand: brand ?? undefined,
          collectionId: collectionId || undefined,
          supplierId: supplierId || undefined,
          costPrice: costPrice ?? undefined,
          gender: gender || undefined,
          size: size || undefined,
          description: description ?? undefined,
          price,
          compareAtPrice: compareAtPrice ?? undefined,
          sku: sku ?? undefined,
          stock,
          isActive,
          featured,
          bestseller,
          imageUrl: storedImageUrl ?? undefined,
          images: storedExtraImages,
          seoSearchPhrases,
          seoScore,
          subCategoryId: subCategoryId || undefined,
          subCategoryIds: subCategoryIds.length > 0 ? subCategoryIds : (subCategoryId ? [subCategoryId] : []),
          hasSizes,
          availableSizes,
        },
      });
    } catch (createErr: any) {
      if (createErr.code === 'P2002') {
        const fallbackSlug = `${(slugify(rawSlug || name) || 'product').slice(0, 40)}-${Date.now().toString(36)}-${generateRandomSuffix(4)}`;
        product = await prisma.product.create({
          data: {
            name,
            slug: fallbackSlug,
            brand: brand ?? undefined,
            collectionId: collectionId || undefined,
            supplierId: supplierId || undefined,
            costPrice: costPrice ?? undefined,
            gender: gender || undefined,
            size: size || undefined,
            description: description ?? undefined,
            price,
            compareAtPrice: compareAtPrice ?? undefined,
            sku: sku ?? undefined,
            stock,
            isActive,
            featured,
            bestseller,
            imageUrl: storedImageUrl ?? undefined,
            images: storedExtraImages,
            seoSearchPhrases,
            seoScore,
            subCategoryId: subCategoryId || undefined,
            subCategoryIds: subCategoryIds.length > 0 ? subCategoryIds : (subCategoryId ? [subCategoryId] : []),
            hasSizes,
            availableSizes,
          },
        });
      } else {
        throw createErr;
      }
    }
    
    revalidatePath('/admin/products');
    revalidatePath(`/products/${product.slug}`);
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products', 'max');
    
    if (addAnother) {
      redirect('/admin/products/new?success=true');
    } else {
      redirect('/admin/products');
    }
  } catch (err: any) {
    if (isNextRedirectError(err)) throw err;
    if (err.message === 'INVALID_SUBCATEGORY') {
      redirect('/admin/products/new?error=invalid_subcategory');
    }
    if (err.code === 'P2002') {
      redirect('/admin/products/new?error=duplicate_slug');
    }
    console.error(err);
    redirect('/admin/products/new?error=unknown');
  }
}

/**
 * Async creation for background queue without redirects
 */
export async function createProductAsync(payload: {
  name: string;
  slug?: string;
  price: number;
  stock?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  collectionId?: string | null;
  subCategoryId?: string | null;
  subCategoryIds?: string[];
  supplierId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  images?: string[];
  sku?: string | null;
  hasSizes?: boolean;
  availableSizes?: string[];
  seoSearchPhrases?: string[];
  seoScore?: number | null;
  isActive?: boolean;
}) {
  await verifyAdmin();

  try {
    const name = payload.name.trim();
    if (!name) {
      return { success: false, error: 'اسم المنتج مطلوب' };
    }

    const rawSlug = payload.slug?.trim() || name;
    const slug = await getUniqueProductSlug(rawSlug);

    const subCategoryIds = (payload.subCategoryIds || []).filter(Boolean);
    let subCategoryId = payload.subCategoryId || (subCategoryIds.length > 0 ? subCategoryIds[0] : null);
    if (subCategoryId && !subCategoryIds.includes(subCategoryId)) {
      subCategoryIds.unshift(subCategoryId);
    }

    if (payload.collectionId && subCategoryIds.length > 0) {
      const validSubCats = await prisma.subCategory.findMany({
        where: { id: { in: subCategoryIds }, collectionId: payload.collectionId },
        select: { id: true },
      });
      if (validSubCats.length !== subCategoryIds.length) {
        return { success: false, error: 'بعض المجموعات الفرعية لا تنتمي للمجموعة الرئيسية' };
      }
    }

    let product;
    try {
      product = await prisma.product.create({
        data: {
          name,
          slug,
          collectionId: payload.collectionId || undefined,
          subCategoryId: subCategoryId || undefined,
          subCategoryIds: subCategoryIds.length > 0 ? subCategoryIds : (subCategoryId ? [subCategoryId] : []),
          supplierId: payload.supplierId || undefined,
          costPrice: payload.costPrice ?? undefined,
          description: payload.description ?? undefined,
          price: payload.price,
          compareAtPrice: payload.compareAtPrice ?? undefined,
          sku: payload.sku ?? undefined,
          stock: payload.stock ?? 10,
          isActive: payload.isActive ?? true,
          imageUrl: payload.imageUrl ?? undefined,
          images: payload.images || [],
          seoSearchPhrases: payload.seoSearchPhrases || [],
          seoScore: payload.seoScore ?? undefined,
          hasSizes: payload.hasSizes ?? false,
          availableSizes: payload.availableSizes || [],
        },
      });
    } catch (createErr: any) {
      if (createErr.code === 'P2002') {
        const fallbackSlug = `${(slugify(rawSlug) || 'product').slice(0, 40)}-${Date.now().toString(36)}-${generateRandomSuffix(4)}`;
        product = await prisma.product.create({
          data: {
            name,
            slug: fallbackSlug,
            collectionId: payload.collectionId || undefined,
            subCategoryId: subCategoryId || undefined,
            subCategoryIds: subCategoryIds.length > 0 ? subCategoryIds : (subCategoryId ? [subCategoryId] : []),
            supplierId: payload.supplierId || undefined,
            costPrice: payload.costPrice ?? undefined,
            description: payload.description ?? undefined,
            price: payload.price,
            compareAtPrice: payload.compareAtPrice ?? undefined,
            sku: payload.sku ?? undefined,
            stock: payload.stock ?? 10,
            isActive: payload.isActive ?? true,
            imageUrl: payload.imageUrl ?? undefined,
            images: payload.images || [],
            seoSearchPhrases: payload.seoSearchPhrases || [],
            seoScore: payload.seoScore ?? undefined,
            hasSizes: payload.hasSizes ?? false,
            availableSizes: payload.availableSizes || [],
          },
        });
      } else {
        throw createErr;
      }
    }

    revalidatePath('/admin/products');
    revalidatePath(`/products/${product.slug}`);
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products', 'max');

    return { success: true, product: { id: product.id, name: product.name, slug: product.slug } };
  } catch (err: any) {
    console.error('Error in createProductAsync:', err);
    return { success: false, error: err.message || 'فشل حفظ المنتج' };
  }
}

export async function deleteProduct(productId: string) {
  await verifyAdmin();
  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products', 'max');
    return { success: true };
  } catch (err) {
    console.error('Delete product error:', err);
    return { success: false, error: 'تعذر حذف المنتج. قد يكون مرتبطاً بطلبات حالية.' };
  }
}

/**
 * Server Action to update a product.
 */
export async function updateProduct(formData: FormData) {
  await verifyAdmin();

  try {
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    let rawSlug = (formData.get('slug') as string)?.trim();
    if (!rawSlug && name) {
      rawSlug = name;
    }
    const slug = await getUniqueProductSlug(rawSlug || name, id);
    const brand = formData.get('brand') as string | null;
    const collectionId = formData.get('collectionId') as string | null;
    const supplierId = formData.get('supplierId') as string | null;
    const costPrice = formData.get('costPrice') ? Number(formData.get('costPrice')) : null;
    const gender = formData.get('gender') as string | null;
    const size = formData.get('size') as string | null;
    const description = formData.get('description') as string | null;
    const price = Number(formData.get('price'));
    const compareAtPrice = formData.get('compareAtPrice')
      ? Number(formData.get('compareAtPrice'))
      : null;
    const sku = formData.get('sku') as string | null;
    const stock = Number(formData.get('stock'));
    const isActive = formData.get('isActive') === 'on';
    const featured = formData.get('featured') === 'on';
    const bestseller = formData.get('bestseller') === 'on';
    const imageUrl = formData.get('imageUrl') as string | null;
    const extraImages = JSON.parse((formData.get('images') as string) || '[]');
    const seoSearchPhrases = JSON.parse((formData.get('seoSearchPhrases') as string) || '[]');
    const seoScore = formData.get('seoScore') ? Number(formData.get('seoScore')) : null;

    const subCategoryId = formData.get('subCategoryId') as string | null;
    const hasSizes = formData.get('hasSizes') === 'true';
    const availableSizes = JSON.parse((formData.get('availableSizes') as string) || '[]');

    if (collectionId && subCategoryId) {
      const subCat = await prisma.subCategory.findUnique({ where: { id: subCategoryId } });
      if (subCat && subCat.collectionId !== collectionId) {
        throw new Error('INVALID_SUBCATEGORY');
      }
    }

    let storedImageUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('https://')) {
      const file = await fetch(imageUrl).then((r) => r.blob());
      const filename = `products/${Date.now()}-main-${Math.random().toString(36).slice(2)}.webp`;
      const { url } = await putTrackedBlob(filename, file, { access: 'public' }, 'product', file.size);
      storedImageUrl = url;
    }

    const storedExtraImages: string[] = [];
    for (const img of extraImages) {
      if (img && typeof img === 'string') {
        if (img.startsWith('https://')) {
          storedExtraImages.push(img);
        } else {
          const file = await fetch(img).then((r) => r.blob());
          const filename = `products/${Date.now()}-extra-${Math.random().toString(36).slice(2)}.webp`;
          const { url } = await putTrackedBlob(filename, file, { access: 'public' }, 'product', file.size);
          storedExtraImages.push(url);
        }
      }
    }

    let product;
    try {
      product = await prisma.product.update({
        where: { id },
        data: {
          name,
          slug,
          brand: brand ?? undefined,
          collectionId: collectionId || undefined,
          supplierId: supplierId || null,
          costPrice: costPrice != null && Number.isFinite(costPrice) && costPrice >= 0 ? costPrice : null,
          gender: gender || undefined,
          size: size || undefined,
          description: description ?? undefined,
          price,
          compareAtPrice: compareAtPrice ?? undefined,
          sku: sku ?? undefined,
          stock,
          isActive,
          featured,
          bestseller,
          imageUrl: storedImageUrl ?? undefined,
          images: storedExtraImages,
          seoSearchPhrases,
          seoScore,
          subCategoryId: subCategoryId || null,
          hasSizes,
          availableSizes,
        },
      });
    } catch (updateErr: any) {
      if (updateErr.code === 'P2002') {
        const fallbackSlug = `${(slugify(rawSlug || name) || 'product').slice(0, 40)}-${Date.now().toString(36)}-${generateRandomSuffix(4)}`;
        product = await prisma.product.update({
          where: { id },
          data: {
            name,
            slug: fallbackSlug,
            brand: brand ?? undefined,
            collectionId: collectionId || undefined,
            supplierId: supplierId || null,
            costPrice: costPrice != null && Number.isFinite(costPrice) && costPrice >= 0 ? costPrice : null,
            gender: gender || undefined,
            size: size || undefined,
            description: description ?? undefined,
            price,
            compareAtPrice: compareAtPrice ?? undefined,
            sku: sku ?? undefined,
            stock,
            isActive,
            featured,
            bestseller,
            imageUrl: storedImageUrl ?? undefined,
            images: storedExtraImages,
            seoSearchPhrases,
            seoScore,
            subCategoryId: subCategoryId || null,
            hasSizes,
            availableSizes,
          },
        });
      } else {
        throw updateErr;
      }
    }

    const addAnother = formData.get('addAnother') === 'true';

    revalidatePath('/admin/products');
    revalidatePath(`/products/${product.slug}`);
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products', 'max');

    if (addAnother) {
      redirect('/admin/products/new?success=true');
    } else {
      redirect('/admin/products');
    }
  } catch (err: any) {
    if (isNextRedirectError(err)) throw err;
    // We don't have id available outside the try, wait, let's keep id extract outside or move it above.
    const id = formData.get('id') as string;
    if (err.message === 'INVALID_SUBCATEGORY') {
      redirect(`/admin/products/${id}/edit?error=invalid_subcategory`);
    }
    if (err.code === 'P2002') {
      redirect(`/admin/products/${id}/edit?error=duplicate_slug`);
    }
    console.error(err);
    redirect(`/admin/products/${id}/edit?error=unknown`);
  }
}

/**
 * Quick action to update product's subCategory from the products list modal.
 */
export async function quickUpdateProductSubCategory(productId: string, subCategoryId: string | null) {
  await verifyAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, collectionId: true },
  });

  if (!product) {
    return { success: false, error: 'المنتج غير موجود' };
  }

  if (subCategoryId) {
    const subCat = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true, collectionId: true },
    });

    if (!subCat) {
      return { success: false, error: 'المجموعة الفرعية غير موجودة' };
    }

    if (product.collectionId && subCat.collectionId !== product.collectionId) {
      return { success: false, error: 'هذه المجموعة الفرعية لا تنتمي للمجموعة الرئيسية الخاصة بالمنتج' };
    }
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      subCategoryId: subCategoryId || null,
    },
  });

  revalidatePath('/admin/products');
  if (product.slug) {
    revalidatePath(`/products/${product.slug}`);
  }
  revalidatePath('/products');
  revalidateTag('products', 'max');

  return { success: true };
}
