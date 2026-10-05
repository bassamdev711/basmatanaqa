'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

// Proper email format validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export async function subscribeToNewsletter(email: string) {
  try {
    // Rate limit: 3 subscriptions per hour per IP
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    if (!checkRateLimit(`newsletter_${ip}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً.' }
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 254) : ''
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return { success: false, error: 'بريد إلكتروني غير صالح' }
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: cleanEmail }
    })

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email: cleanEmail },
          data: { isActive: true }
        })
      }
      return { success: true, message: 'أنت مشترك بالفعل!' }
    }

    await prisma.newsletterSubscriber.create({
      data: { email: cleanEmail }
    })

    revalidatePath('/admin/marketing/newsletter')
    return { success: true, message: 'تم الاشتراك بنجاح!' }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return { success: false, error: 'حدث خطأ أثناء الاشتراك' }
  }
}

export async function deleteSubscriber(id: string) {
  await verifyAdmin()
  try {
    await prisma.newsletterSubscriber.delete({
      where: { id }
    })
    revalidatePath('/admin/marketing/newsletter')
    return { success: true }
  } catch (error) {
    console.error('Delete subscriber error:', error)
    return { success: false, error: 'حدث خطأ أثناء الحذف' }
  }
}

export async function getSubscribers() {
  await verifyAdmin()
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: subscribers }
  } catch (error) {
    console.error('Get subscribers error:', error)
    return { success: false, error: 'حدث خطأ أثناء جلب المشتركين' }
  }
}
