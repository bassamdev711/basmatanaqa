'use server';
import prisma from '@/lib/prisma';

export async function getMainCategories() {
  return await prisma.mainCategory.findMany({
    where: { isActive: true },
    include: { subCategories: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSubCategories(mainCategoryId: string) {
  return await prisma.subCategory.findMany({
    where: { isActive: true, mainCategoryId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createMainCategory(data: { name: string, description?: string }) {
  const slug = `category-${Date.now()}`;
  await prisma.mainCategory.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
    }
  });
}

export async function createSubCategory(data: { name: string, mainCategoryId: string, description?: string }) {
  const slug = `sub-${Date.now()}`;
  await prisma.subCategory.create({
    data: {
      name: data.name,
      slug,
      mainCategoryId: data.mainCategoryId,
      description: data.description,
    }
  });
}
