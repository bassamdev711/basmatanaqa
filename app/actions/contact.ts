'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyAdmin } from '@/lib/auth'

export async function submitContactMessage(data: { name: string, phone: string, email: string, message: string }) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
    
    // Limit to 5 messages per hour (3600000 ms) per IP
    if (!checkRateLimit(`contact_${ip}`, 5, 3600000)) {
      return { success: false, error: 'لقد تجاوزت الحد المسموح به من الرسائل. يرجى المحاولة لاحقاً.' }
    }

    if (!data.name || !data.phone || !data.email || !data.message) {
      return { success: false, error: 'يرجى تعبئة جميع الحقول' }
    }

    // Input length limits
    if (data.name.length > 100) return { success: false, error: 'الاسم طويل جداً' }
    if (data.phone.length > 20) return { success: false, error: 'رقم الهاتف غير صالح' }
    if (data.email.length > 254) return { success: false, error: 'البريد الإلكتروني غير صالح' }
    if (data.message.length > 2000) return { success: false, error: 'الرسالة طويلة جداً (2000 حرف كحد أقصى)' }

    await prisma.contactMessage.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
      }
    })

    revalidatePath('/admin/inbox')
    return { success: true, message: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً!' }
  } catch (error) {
    console.error('Submit contact message error:', error)
    return { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' }
  }
}

export async function getContactMessages() {
  await verifyAdmin()
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: messages }
  } catch (error) {
    console.error('Get contact messages error:', error)
    return { success: false, error: 'حدث خطأ أثناء جلب الرسائل' }
  }
}

export async function markMessageAsRead(id: string) {
  await verifyAdmin()
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true }
    })
    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (error) {
    console.error('Mark message as read error:', error)
    return { success: false, error: 'حدث خطأ' }
  }
}

export async function deleteMessage(id: string) {
  await verifyAdmin()
  try {
    await prisma.contactMessage.delete({
      where: { id }
    })
    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (error) {
    console.error('Delete message error:', error)
    return { success: false, error: 'حدث خطأ أثناء الحذف' }
  }
}
