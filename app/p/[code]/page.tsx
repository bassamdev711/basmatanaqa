import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { getStoreConfig } from '@/lib/store-config';
import ShortRedirectClient from './ShortRedirectClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { code } = await params;
  const sParams = await searchParams;

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { shortCode: code.toLowerCase() },
        { slug: code },
      ],
      isActive: true,
    },
    select: {
      name: true,
      description: true,
      imageUrl: true,
      images: true,
      price: true,
    },
  });

  if (!product) return { robots: { index: false, follow: false } };

  const store = await getStoreConfig();
  
  // Pick active image based on ?img= query parameter
  let targetImageUrl = product.imageUrl;
  if (sParams.img) {
    const imgIdx = parseInt(sParams.img as string, 10);
    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];
    if (!isNaN(imgIdx) && allImages[imgIdx]) {
      targetImageUrl = allImages[imgIdx];
    }
  }

  const description = product.description || `تسوق ${product.name} الآن من ${store.name}`;

  return {
    title: `${product.name} | ${store.name}`,
    description,
    openGraph: {
      title: `${product.name} | ${store.name}`,
      description,
      siteName: store.name,
      type: 'website',
      ...(targetImageUrl ? { 
        images: [{ 
          url: targetImageUrl, 
          width: 800, 
          height: 800, 
          alt: product.name 
        }] 
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ${store.name}`,
      description,
      ...(targetImageUrl ? { images: [targetImageUrl] } : {}),
    },
  };
}

export default async function ShortUrlRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await params;
  const sParams = await searchParams;

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { shortCode: code.toLowerCase() },
        { slug: code },
      ],
    },
    select: {
      slug: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Preserve query parameters like img=1, size=XL
  const searchString = new URLSearchParams(sParams as Record<string, string>).toString();
  const targetUrl = `/products/${encodeURIComponent(product.slug)}${searchString ? `?${searchString}` : ''}`;

  return <ShortRedirectClient targetUrl={targetUrl} />;
}
