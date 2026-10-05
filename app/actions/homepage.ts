'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'

const HOMEPAGE_FIELDS = [
  'heroTitle',
  'heroSubtitle',
  'heroDescription',
  'heroPrimaryButton',
  'heroSecondaryButton',
  'aboutTopTitle',
  'aboutMainTitle',
  'aboutQuote',
  'aboutDescription',
  'expTopTitle',
  'expMainTitle',
  'expBox1Title',
  'expBox1Desc',
  'expBox2Title',
  'expBox2Desc',
  'statsJson',
] as const

type HomepageField = (typeof HOMEPAGE_FIELDS)[number]
type HomepageUpdateInput = Partial<Record<HomepageField, string>>

function sanitizeHomepageUpdate(data: unknown): HomepageUpdateInput {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}

  const input = data as Record<string, unknown>
  const update: HomepageUpdateInput = {}

  for (const field of HOMEPAGE_FIELDS) {
    const value = input[field]
    if (typeof value !== 'string' || value.length > 10_000) continue

    if (field === 'statsJson') {
      try {
        const parsed = JSON.parse(value) as unknown
        if (!Array.isArray(parsed) || parsed.length > 20) continue
        if (!parsed.every((entry) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
          const record = entry as Record<string, unknown>
          return typeof record.value === 'string' && typeof record.label === 'string'
            && record.value.length <= 100 && record.label.length <= 200
        })) continue
      } catch {
        continue
      }
    }

    update[field] = value.trim()
  }

  return update
}

export async function getHomepageSettings() {
  try {
    let settings = await prisma.homepageSettings.findUnique({
      where: { id: 'singleton' },
    })

    if (!settings) {
      settings = await prisma.homepageSettings.create({
        data: { id: 'singleton' },
      })
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error fetching homepage settings:', error)
    return { success: false, error: 'حدث خطأ أثناء جلب إعدادات الصفحة الرئيسية' }
  }
}

export async function updateHomepageSettings(data: unknown) {
  try {
    await verifyAdmin()

    const update = sanitizeHomepageUpdate(data)
    if (Object.keys(update).length === 0) {
      return { success: false, error: 'لا توجد حقول صالحة للتحديث.' }
    }

    const settings = await prisma.homepageSettings.upsert({
      where: { id: 'singleton' },
      update,
      create: {
        id: 'singleton',
        ...update,
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/homepage-content')

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating homepage settings:', error)
    return { success: false, error: 'حدث خطأ أثناء تحديث الإعدادات' }
  }
}
