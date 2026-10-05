'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'

export async function getContactSettings() {
  await verifyAdmin()
  try {
    let settings = await prisma.contactSettings.findUnique({
      where: { id: 'singleton' },
    })

    if (!settings) {
      settings = await prisma.contactSettings.create({
        data: {
          id: 'singleton',
        },
      })
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Failed to get contact settings:', error)
    return { success: false, error: 'حدث خطأ أثناء جلب إعدادات التواصل' }
  }
}

export async function updateContactSettings(data: {
  phoneNumber?: string
  showPhoneNumber?: boolean
  whatsappNumber?: string
  showWhatsappNumber?: boolean
  emailAddress?: string
  showEmailAddress?: boolean
  address?: string
  showAddress?: boolean
  instagramUrl?: string
  showInstagram?: boolean
  facebookUrl?: string
  showFacebook?: boolean
  twitterUrl?: string
  showTwitter?: boolean
  telegramUrl?: string
  showTelegram?: boolean
  threadsUrl?: string
  showThreads?: boolean
}) {
  await verifyAdmin()
  try {
    const settings = await prisma.contactSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data,
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/contact-settings')
    
    return { success: true, data: settings }
  } catch (error) {
    console.error('Failed to update contact settings:', error)
    return { success: false, error: 'حدث خطأ أثناء تحديث إعدادات التواصل' }
  }
}
