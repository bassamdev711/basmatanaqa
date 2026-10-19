import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

  // Preserve any query parameters like img=1, size=XL
  const searchString = new URLSearchParams(sParams as Record<string, string>).toString();
  const targetUrl = `/products/${product.slug}${searchString ? `?${searchString}` : ''}`;

  redirect(targetUrl);
}
