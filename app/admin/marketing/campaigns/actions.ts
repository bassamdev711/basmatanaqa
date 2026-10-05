'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifyAdmin } from '@/lib/auth'

// ── إنشاء حملة جديدة ──────────────────────────────────────
export async function createCampaign(formData: FormData) {
  await verifyAdmin()
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string | null
  const description = formData.get('description') as string | null
  const imageUrl = formData.get('imageUrl') as string | null
  const couponCode = formData.get('couponCode') as string | null
  const discountPercentageStr = formData.get('discountPercentage') as string | null
  const discountPercentage = discountPercentageStr ? parseInt(discountPercentageStr) : null
  const startDate = new Date(formData.get('startDate') as string)
  const endDate = new Date(formData.get('endDate') as string)
  const isActive = formData.get('isActive') === 'on'
  
  const productIds = formData.getAll('productIds') as string[]

  await prisma.campaign.create({
    data: {
      title,
      slug: slug || null,
      description: description || null,
      imageUrl: imageUrl || null,
      couponCode: couponCode || null,
      discountPercentage,
      startDate,
      endDate,
      isActive,
      products: {
        connect: productIds.map(id => ({ id }))
      }
    }
  })

  revalidatePath('/admin/marketing/campaigns')
  redirect('/admin/marketing/campaigns')
}

// ── تحديث حملة ─────────────────────────────────────────────
export async function updateCampaign(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string | null
  const description = formData.get('description') as string | null
  const imageUrl = formData.get('imageUrl') as string | null
  const couponCode = formData.get('couponCode') as string | null
  const discountPercentageStr = formData.get('discountPercentage') as string | null
  const discountPercentage = discountPercentageStr ? parseInt(discountPercentageStr) : null
  const startDate = new Date(formData.get('startDate') as string)
  const endDate = new Date(formData.get('endDate') as string)
  const isActive = formData.get('isActive') === 'on'

  const productIds = formData.getAll('productIds') as string[]

  await prisma.campaign.update({
    where: { id },
    data: {
      title,
      slug: slug || null,
      description: description || null,
      imageUrl: imageUrl || null,
      couponCode: couponCode || null,
      discountPercentage,
      startDate,
      endDate,
      isActive,
      products: {
        set: productIds.map(pid => ({ id: pid }))
      }
    }
  })

  revalidatePath('/admin/marketing/campaigns')
  redirect('/admin/marketing/campaigns')
}

// ── حذف حملة ───────────────────────────────────────────────
export async function deleteCampaign(id: string) {
  await verifyAdmin()
  await prisma.campaign.delete({ where: { id } })
  revalidatePath('/admin/marketing/campaigns')
  return { success: true }
}

// ── تفعيل/تعطيل حملة ──────────────────────────────────────
export async function toggleCampaign(id: string, isActive: boolean) {
  await verifyAdmin()
  await prisma.campaign.update({
    where: { id },
    data: { isActive }
  })
  revalidatePath('/admin/marketing/campaigns')
  return { success: true }
}
