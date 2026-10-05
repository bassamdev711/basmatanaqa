// app/admin/products/actions.ts

'use server';
import prisma from '@/lib/prisma';
import { putTrackedBlob } from '@/lib/usage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { verifyAdmin } from '@/lib/auth';

/**
 * Server Action to create a new product.
 * Receives the form data from the client component, uploads the main image to Vercel Blob
 * (if an image URL is provided), stores the product in the database and revalidates the
 * product list page so the new product appears instantly.
 */
export async function createProduct(formData: FormData) {
  await verifyAdmin();
  // Extract fields
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const brand = formData.get('brand') as string | null;
  const collectionId = formData.get('collectionId') as string | null;
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

  // Upload main image to Vercel Blob if a URL is provided (client may have already uploaded)
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');

  let storedImageUrl = imageUrl;
  if (imageUrl && !imageUrl.startsWith('https://')) {
    const file = await fetch(imageUrl).then((r) => r.blob());
    const filename = `products/${Date.now()}-main-${Math.random().toString(36).slice(2)}.webp`;
    const { url } = await putTrackedBlob(filename, file, { access: 'public', token: blobToken }, 'product', file.size);
    storedImageUrl = url;
  }

  // Upload additional images (array of data URLs)
  const storedExtraImages: string[] = [];
  for (const img of extraImages) {
    if (img && typeof img === 'string') {
      if (img.startsWith('https://')) {
        storedExtraImages.push(img);
      } else {
        const file = await fetch(img).then((r) => r.blob());
        const filename = `products/${Date.now()}-extra-${Math.random().toString(36).slice(2)}.webp`;
        const { url } = await putTrackedBlob(filename, file, { access: 'public', token: blobToken }, 'product', file.size);
        storedExtraImages.push(url);
      }
    }
  }

  // Create product in DB
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brand: brand ?? undefined,
      collectionId: collectionId || undefined,
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
    },
  });

  // Revalidate the product list and product page
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);

  redirect('/admin/products');
}

/**
 * Server Action to delete a product.
 */
export async function deleteProduct(productId: string) {
  await verifyAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath('/admin/products');
  return { success: true };
}

/**
 * Server Action to update a product.
 */
export async function updateProduct(formData: FormData) {
  await verifyAdmin();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const brand = formData.get('brand') as string | null;
  const collectionId = formData.get('collectionId') as string | null;
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

  const blobToken2 = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken2) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');

  let storedImageUrl = imageUrl;
  if (imageUrl && !imageUrl.startsWith('https://')) {
    const file = await fetch(imageUrl).then((r) => r.blob());
    const filename = `products/${Date.now()}-main-${Math.random().toString(36).slice(2)}.webp`;
    const { url } = await putTrackedBlob(filename, file, { access: 'public', token: blobToken2 }, 'product', file.size);
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
        const { url } = await putTrackedBlob(filename, file, { access: 'public', token: blobToken2 }, 'product', file.size);
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
    },
  });

  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  redirect('/admin/products');
}
