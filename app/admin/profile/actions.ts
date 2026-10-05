'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyAdmin, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/hash'
import { validateAdminPassword } from '@/lib/password-policy'
import { revalidatePath } from 'next/cache'

function getText(formData: FormData, key: string, maxLength: number): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function setupAdminProfile(formData: FormData) {
  await verifyAdmin()

  const name = getText(formData, 'name', 100)
  const avatarUrl = getText(formData, 'avatarUrl', 2048)
  const password = typeof formData.get('password') === 'string' ? String(formData.get('password')) : ''

  if (!name || name.length < 2 || !password) {
    return { success: false, error: 'الاسم وكلمة المرور مطلوبان' }
  }

  const passwordError = validateAdminPassword(password)
  if (passwordError) {
    return { success: false, error: passwordError }
  }

  const existingProfile = await prisma.adminProfile.findUnique({
    where: { id: 'singleton' },
    select: { isSetupComplete: true },
  })

  if (existingProfile?.isSetupComplete) {
    return { success: false, error: 'تم إعداد حساب الإدارة مسبقاً' }
  }

  const hashedPassword = hashPassword(password)

  await prisma.adminProfile.upsert({
    where: { id: 'singleton' },
    update: {
      name,
      avatarUrl: avatarUrl || null,
      passwordHash: hashedPassword,
      isSetupComplete: true,
    },
    create: {
      id: 'singleton',
      name,
      avatarUrl: avatarUrl || null,
      passwordHash: hashedPassword,
      isSetupComplete: true,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateAdminProfile(formData: FormData) {
  await verifyAdmin()

  const name = getText(formData, 'name', 100)
  const avatarUrl = getText(formData, 'avatarUrl', 2048)
  const themeBackground = getText(formData, 'themeBackground', 100)
  const currentPassword = typeof formData.get('currentPassword') === 'string' ? String(formData.get('currentPassword')) : ''
  const newPassword = typeof formData.get('newPassword') === 'string' ? String(formData.get('newPassword')) : ''

  const profile = await prisma.adminProfile.findUnique({
    where: { id: 'singleton' },
  })

  if (!profile || !profile.passwordHash || !profile.isSetupComplete) {
    return { success: false, error: 'ملف الإدارة غير مهيأ بشكل صحيح' }
  }

  let updatedPasswordHash = profile.passwordHash
  let passwordChanged = false

  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, profile.passwordHash)) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' }
    }

    const passwordError = validateAdminPassword(newPassword)
    if (passwordError) {
      return { success: false, error: passwordError }
    }

    updatedPasswordHash = hashPassword(newPassword)
    passwordChanged = true
  }

  await prisma.adminProfile.update({
    where: { id: 'singleton' },
    data: {
      name: name || profile.name,
      avatarUrl: avatarUrl || profile.avatarUrl,
      themeBackground: themeBackground || profile.themeBackground,
      passwordHash: updatedPasswordHash,
    },
  })

  if (passwordChanged) {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE_NAME)
  }

  revalidatePath('/admin')
  return { success: true, passwordChanged }
}
