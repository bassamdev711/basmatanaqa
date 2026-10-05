'use server'

import prisma from '@/lib/prisma'
import { putTrackedBlob } from '@/lib/usage'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'

export async function getBrandingSettings() {
  await verifyAdmin()
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
      select: {
        ogImageUrl: true,
        faviconUrl: true,
        storeUrl: true,
        storeName: true,
        storeNameLatin: true,
        storeTagline: true,
        storeDescription: true,
        logoUrl: true,
        locale: true,
        currencyCode: true,
      }
    })
    return { success: true, settings }
  } catch {
    return { success: false, error: 'فشل في جلب إعدادات الهوية البصرية' }
  }
}

export type StoreBrandingInput = {
  storeName: string
  storeNameLatin: string
  storeTagline: string
  storeDescription: string
  locale: string
  currencyCode: string
}

export async function saveStoreBranding(input: StoreBrandingInput) {
  await verifyAdmin()
  try {
    const storeName = input.storeName.trim()
    const storeNameLatin = input.storeNameLatin.trim()
    const storeTagline = input.storeTagline.trim()
    const storeDescription = input.storeDescription.trim()
    const locale = input.locale.trim().toLowerCase()
    const currencyCode = input.currencyCode.trim().toUpperCase()

    if (!storeName || storeName.length > 80) {
      return { success: false, error: 'اسم المتجر مطلوب وبحد أقصى 80 محرفًا' }
    }
    if (!storeNameLatin || storeNameLatin.length > 80) {
      return { success: false, error: 'الاسم اللاتيني مطلوب وبحد أقصى 80 محرفًا' }
    }
    if (storeTagline.length > 160 || storeDescription.length > 500) {
      return { success: false, error: 'تجاوز أحد النصوص الحد المسموح به' }
    }
    if (!['ar', 'en'].includes(locale)) {
      return { success: false, error: 'اللغة المختارة غير مدعومة' }
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      return { success: false, error: 'رمز العملة يجب أن يتكون من 3 أحرف' }
    }

    await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: { storeName, storeNameLatin, storeTagline, storeDescription, locale, currencyCode },
      create: {
        id: 'singleton',
        storeName,
        storeNameLatin,
        storeTagline,
        storeDescription,
        locale,
        currencyCode,
        seoSearchPhrases: [],
        updatedAt: new Date(),
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/branding')
    return { success: true }
  } catch (error) {
    console.error('Store branding save error:', error)
    return { success: false, error: 'فشل في حفظ إعدادات المتجر' }
  }
}

export async function uploadOgImage(formData: FormData) {
  await verifyAdmin()
  try {
    const file = formData.get('ogImage') as File
    if (!file || file.size === 0) return { success: false, error: 'لم يتم اختيار ملف' }

    const blob = await putTrackedBlob(`branding/og-image-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: 'public',
      contentType: file.type,
    }, 'branding', file.size)

    await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: { ogImageUrl: blob.url },
      create: { id: 'singleton', ogImageUrl: blob.url, updatedAt: new Date() }
    })

    revalidatePath('/')
    return { success: true, url: blob.url }
  } catch (error) {
    console.error('OG Image upload error:', error)
    return { success: false, error: 'فشل في رفع الصورة' }
  }
}

export async function uploadFavicon(formData: FormData) {
  await verifyAdmin()
  try {
    const file = formData.get('favicon') as File
    if (!file || file.size === 0) return { success: false, error: 'لم يتم اختيار ملف' }

    const blob = await putTrackedBlob(`branding/favicon-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: 'public',
      contentType: file.type,
    }, 'branding', file.size)

    await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: { faviconUrl: blob.url },
      create: { id: 'singleton', faviconUrl: blob.url, updatedAt: new Date() }
    })

    revalidatePath('/')
    return { success: true, url: blob.url }
  } catch (error) {
    console.error('Favicon upload error:', error)
    return { success: false, error: 'فشل في رفع الأيقونة' }
  }
}

export async function saveStoreUrl(url: string) {
  await verifyAdmin()
  try {
    if (!url) return { success: false, error: 'الرابط فارغ' }
    
    await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: { storeUrl: url },
      create: { id: 'singleton', storeUrl: url, updatedAt: new Date() }
    })

    return { success: true }
  } catch {
    return { success: false, error: 'فشل في حفظ رابط المتجر' }
  }
}
