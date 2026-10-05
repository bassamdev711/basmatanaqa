'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

export async function addReview(data: {
  name: string
  city?: string
  content: string
  rating: number
  productId?: string
}) {
  try {
    // Rate limit: 3 reviews per hour per IP
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    if (!checkRateLimit(`review_${ip}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'تم تجاوز الحد المسموح لإرسال التقييمات. يرجى المحاولة لاحقاً.' }
    }

    if (!data.name || data.name.trim().length < 2) return { success: false, error: 'الاسم قصير جداً' }
    if (data.name.length > 100) return { success: false, error: 'الاسم طويل جداً' }
    if (!data.content || data.content.trim().length < 5) return { success: false, error: 'محتوى التقييم قصير جداً' }
    if (data.content.length > 500) return { success: false, error: 'محتوى التقييم يتجاوز الحد المسموح' }
    if (data.rating < 1 || data.rating > 5) return { success: false, error: 'التقييم غير صحيح' }

    // حماية بسيطة من السبام: منع تكرار نفس التقييم من نفس الشخص
    const recentDuplicate = await prisma.review.findFirst({
      where: {
        name: data.name,
        content: data.content,
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } // خلال 24 ساعة
      }
    })

    if (recentDuplicate) {
      return { success: false, error: 'لقد قمت بإرسال هذا التقييم مسبقاً' }
    }
    const review = await prisma.review.create({
      data: {
        name: data.name,
        city: data.city,
        content: data.content,
        rating: data.rating,
        productId: data.productId,
        isGlobal: !data.productId, // If no productId, it's global
        status: 'PENDING'
      }
    })

    return { success: true, data: review }
  } catch (error) {
    console.error('Error adding review:', error)
    return { success: false, error: 'حدث خطأ أثناء إرسال المراجعة' }
  }
}

export async function getReviews(productId?: string) {
  try {
    const whereClause: { status: 'APPROVED'; productId?: string; isGlobal?: boolean } = { status: 'APPROVED' }
    
    if (productId) {
      whereClause.productId = productId
    } else {
      whereClause.isGlobal = true
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: reviews }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { success: false, error: 'حدث خطأ أثناء جلب المراجعات' }
  }
}

export async function updateReviewStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
  await verifyAdmin()
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status }
    })

    revalidatePath('/')
    if (review.productId) {
      revalidatePath(`/product/${review.productId}`) // We don't have the slug here directly, might need to revalidate all products or specific one if needed
      // To be safe, just revalidate product page pattern if possible, or fetch the slug
      const product = await prisma.product.findUnique({ where: { id: review.productId }})
      if (product) revalidatePath(`/product/${product.slug}`)
    }

    revalidatePath('/admin/reviews')

    return { success: true, data: review }
  } catch (error) {
    console.error('Error updating review:', error)
    return { success: false, error: 'حدث خطأ أثناء تحديث المراجعة' }
  }
}

export async function deleteReview(id: string) {
  await verifyAdmin()
  try {
    const review = await prisma.review.delete({
      where: { id }
    })

    revalidatePath('/')
    if (review.productId) {
      const product = await prisma.product.findUnique({ where: { id: review.productId }})
      if (product) revalidatePath(`/product/${product.slug}`)
    }
    revalidatePath('/admin/reviews')

    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: 'حدث خطأ أثناء حذف المراجعة' }
  }
}
