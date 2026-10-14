import prisma from '@/lib/prisma';

/**
 * Normalizes any string (Arabic, English, digits, etc.) into a clean URL-friendly slug.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')
    // Allow alphanumeric Latin, Arabic unicode range (\u0600-\u06FF), and hyphens
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    // Collapse multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Trim hyphens from ends
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a short random alphanumeric string (e.g. '7k2a', 'm9x4').
 */
export function generateRandomSuffix(length = 4): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Ensures a slug is guaranteed to be unique in the Product database table.
 * 1. Checks if the base slug is available.
 * 2. If already taken, automatically appends a sequential number (-2, -3, -4, ...).
 * 3. If numbers are exhausted or high collisions, uses a random anti-collision token.
 * 
 * Allows product names to be repeated infinitely without any errors.
 *
 * @param rawSlug - The input slug or product name to slugify
 * @param currentProductId - (Optional) Current product ID when updating, to allow keeping its own slug
 * @returns A guaranteed unique slug string
 */
export async function getUniqueProductSlug(
  rawSlug: string,
  currentProductId?: string
): Promise<string> {
  let base = slugify(rawSlug);
  if (!base) {
    base = `product-${generateRandomSuffix(6)}`;
  }

  // 1. Check if the clean base slug is already available
  const existing = await prisma.product.findUnique({
    where: { slug: base },
    select: { id: true },
  });

  if (!existing || (currentProductId && existing.id === currentProductId)) {
    return base;
  }

  // 2. Try sequential numbering: base-2, base-3, base-4 ... up to base-50
  for (let counter = 2; counter <= 50; counter++) {
    const candidate = `${base}-${counter}`;
    const conflict = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!conflict || (currentProductId && conflict.id === currentProductId)) {
      return candidate;
    }
  }

  // 3. If sequential numbers are all taken, use a random anti-collision code
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = generateRandomSuffix(attempt > 5 ? 6 : 4);
    const candidate = `${base}-${suffix}`;

    const conflict = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!conflict || (currentProductId && conflict.id === currentProductId)) {
      return candidate;
    }
  }

  // 4. Fallback timestamp + random token for absolute collision resistance
  return `${base}-${Date.now().toString(36)}-${generateRandomSuffix(4)}`;
}
