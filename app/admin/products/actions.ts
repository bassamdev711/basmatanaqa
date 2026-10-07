// app/admin/products/actions.ts

'use server';
import prisma from '@/lib/prisma';
import { putTrackedBlob } from '@/lib/usage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { verifyAdmin } from '@/lib/auth';

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
    const name = formData.get('name') as string;
    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = `product-${Date.now()}`;
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

    const product = await prisma.product.create({
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
        hasSizes,
        availableSizes,
      },
    });
    
    revalidatePath('/admin/products');
    revalidatePath(`/products/${product.slug}`);
    
    redirect('/admin/products');
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

export async function deleteProduct(productId: string) {
  await verifyAdmin();
  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath('/admin/products');
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
    const name = formData.get('name') as string;
    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = `product-${Date.now()}`;
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

    const product = await prisma.product.update({
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

    revalidatePath('/admin/products');
    revalidatePath(`/products/${product.slug}`);

    redirect('/admin/products');
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
