'use server'

import { verifyAdmin } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getLegalPages() {
  await verifyAdmin();

  return await prisma.legalPage.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createLegalPage(data: { title: string; slug: string; content: string; isActive: boolean }) {
  await verifyAdmin();

  try {
    const existing = await prisma.legalPage.findUnique({ where: { slug: data.slug } })
    if (existing) {
      return { success: false, error: 'الرابط (slug) مستخدم مسبقاً، يرجى اختيار رابط مختلف.' }
    }
    await prisma.legalPage.create({ data })
    revalidatePath('/admin/legal-pages')
    revalidatePath('/') // To update footer
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'فشل في إنشاء الصفحة' }
  }
}

export async function updateLegalPage(id: string, data: { title: string; slug: string; content: string; isActive: boolean }) {
  await verifyAdmin();

  try {
    const existing = await prisma.legalPage.findUnique({ where: { slug: data.slug } })
    if (existing && existing.id !== id) {
      return { success: false, error: 'الرابط (slug) مستخدم لصفحة أخرى.' }
    }
    await prisma.legalPage.update({
      where: { id },
      data
    })
    revalidatePath('/admin/legal-pages')
    revalidatePath('/')
    revalidatePath(`/pages/${data.slug}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'فشل في تحديث الصفحة' }
  }
}

export async function deleteLegalPage(id: string) {
  await verifyAdmin();

  try {
    await prisma.legalPage.delete({ where: { id } })
    revalidatePath('/admin/legal-pages')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'فشل في الحذف' }
  }
}
