import prisma from '@/lib/prisma';

export const BASE_PRODUCT_NUMBER = 711;

/**
 * Returns the next available itemNumber (starts from 711)
 * and corresponding shortCode e.g. "shahrzad711"
 */
export async function getNextProductNumberAndCode(): Promise<{ itemNumber: number; shortCode: string }> {
  const latest = await prisma.product.findFirst({
    where: { itemNumber: { not: null } },
    orderBy: { itemNumber: 'desc' },
    select: { itemNumber: true },
  });

  const nextNumber = latest?.itemNumber ? latest.itemNumber + 1 : BASE_PRODUCT_NUMBER;
  const shortCode = `shahrzad${nextNumber}`;

  return { itemNumber: nextNumber, shortCode };
}

/**
 * Assigns sequential numbers (starting from 711) to any existing products that don't have one yet.
 */
export async function backfillExistingProductsShortCodes(): Promise<number> {
  const productsWithoutCode = await prisma.product.findMany({
    where: { itemNumber: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (productsWithoutCode.length === 0) return 0;

  const latest = await prisma.product.findFirst({
    where: { itemNumber: { not: null } },
    orderBy: { itemNumber: 'desc' },
    select: { itemNumber: true },
  });

  let currentNumber = latest?.itemNumber ? latest.itemNumber + 1 : BASE_PRODUCT_NUMBER;

  for (const p of productsWithoutCode) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        itemNumber: currentNumber,
        shortCode: `shahrzad${currentNumber}`,
      },
    });
    currentNumber++;
  }

  return productsWithoutCode.length;
}
