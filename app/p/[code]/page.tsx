import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { getSiteUrl, getStoreConfig } from '@/lib/store-config';
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
  const siteUrl = getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || store.storeUrl);
  
  // Pick active image based on ?img= query parameter
  let targetImageUrl = product.imageUrl;
  if (sParams.img) {
    const imgIdx = parseInt(sParams.img as string, 10);
    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];
    if (!isNaN(imgIdx) && allImages[imgIdx]) {
      targetImageUrl = allImages[imgIdx];
    }
  }

  const absoluteImageUrl = targetImageUrl ? new URL(targetImageUrl, siteUrl).toString() : undefined;
  
  // Build query string to preserve active image/size in canonical and og:url
  const queryParams = new URLSearchParams();
  if (sParams.img && typeof sParams.img === 'string') queryParams.set('img', sParams.img);
  if (sParams.size && typeof sParams.size === 'string') queryParams.set('size', sParams.size);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const absoluteShortUrl = new URL(`/p/${encodeURIComponent(code)}${queryString}`, siteUrl).toString();
  const description = product.description || `تسوق ${product.name} الآن من ${store.name}`;

  return {
    metadataBase: siteUrl,
    title: `${product.name} | ${store.name}`,
    description,
    alternates: {
      canonical: absoluteShortUrl,
    },
    openGraph: {
      title: `${product.name} | ${store.name}`,
      description,
      url: absoluteShortUrl,
      siteName: store.name,
      type: 'website',
      ...(absoluteImageUrl ? { 
        images: [{ 
          url: absoluteImageUrl, 
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
      ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
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
