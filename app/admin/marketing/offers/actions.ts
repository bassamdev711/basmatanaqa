'use server'

import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getOffers() {
  await verifyAdmin()
  const offers = await prisma.productOffer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true }
  })

  return offers.map(o => ({
    ...o,
    offerPrice: o.offerPrice.toNumber(),
    originalPrice: o.originalPrice.toNumber(),
    product: {
      id: o.product.id,
      name: o.product.name,
      imageUrl: o.product.imageUrl
    }
  }))
}

export async function getProducts() {
  await verifyAdmin()
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, price: true, imageUrl: true }
  })
  return products.map(p => ({ ...p, price: p.price.toNumber() }))
}

type OfferInput = {
  productId: string
  offerPrice: number
  originalPrice: number
  startDate: string
  endDate: string
  isActive: boolean
  showInHomepage: boolean
  imageUrl?: string | null
}

export async function createOffer(data: OfferInput) {
  await verifyAdmin()
  try {
    await prisma.productOffer.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }
    })
    revalidatePath('/')
    revalidatePath('/admin/marketing/offers')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: 'حدث خطأ أثناء إضافة العرض' }
  }
}

export async function updateOffer(id: string, data: OfferInput) {
  await verifyAdmin()
  try {
    await prisma.productOffer.update({
      where: { id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }
    })
    revalidatePath('/')
    revalidatePath('/admin/marketing/offers')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: 'حدث خطأ أثناء تعديل العرض' }
  }
}

export async function deleteOffer(id: string) {
  await verifyAdmin()
  try {
    await prisma.productOffer.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin/marketing/offers')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'تعذر حذف العرض' }
  }
}
