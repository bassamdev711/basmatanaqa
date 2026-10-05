'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { getDatabaseBytes, getUsageSummary, bytesToJSON } from '@/lib/usage'

const LEGACY_MB = 1024 * 1024
const LEGACY_GB = 1024 * LEGACY_MB

async function getLegacyUsageSummary(pageViews: number) {
  const database = await getDatabaseBytes()
  const estimatedBandwidthBytes = Math.max(0, Math.round(pageViews * 0.002 * LEGACY_GB))

  return {
    fallback: true as const,
    subscription: {
      status: 'ACTIVE',
      startedAt: new Date(0),
      renewsAt: null,
      graceUntil: null,
      notes: 'عرض توافق قديم؛ سيتم تفعيل القياس التفصيلي بعد تطبيق ترحيل usage.',
    },
    plan: {
      id: 'legacy-free',
      name: 'الخطة الأساسية',
      slug: 'legacy-free',
      price: '0',
      currencyCode: 'USD',
    },
    resources: [
      {
        resource: 'database' as const,
        usedBytes: database.bytes,
        limitBytes: BigInt(512) * BigInt(LEGACY_MB),
        source: database.source,
        confidence: database.confidence,
      },
      {
        resource: 'blob' as const,
        usedBytes: BigInt(0),
        limitBytes: BigInt(LEGACY_GB),
        source: 'legacy-fallback',
        confidence: 'fallback',
      },
      {
        resource: 'bandwidth' as const,
        usedBytes: BigInt(estimatedBandwidthBytes),
        limitBytes: BigInt(100) * BigInt(LEGACY_GB),
        source: 'estimated-from-pageviews',
        confidence: 'estimated',
      },
    ],
    availablePlans: [],
  }
}

export async function saveManualSubscription(input: {
  planId: string
  status: string
  startedAt: string
  renewsAt: string
  graceUntil: string
  notes: string
}) {
  await verifyAdmin()
  if (!input.planId || !['ACTIVE', 'GRACE', 'SUSPENDED', 'CANCELLED'].includes(input.status)) {
    return { success: false as const, error: 'بيانات الخطة غير صالحة' }
  }

  const plan = await prisma.usagePlan.findUnique({ where: { id: input.planId } })
  if (!plan || !plan.isActive) return { success: false as const, error: 'الخطة غير موجودة أو غير مفعلة' }

  const parseDate = (value: string) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const startedAt = parseDate(input.startedAt)
  const renewsAt = parseDate(input.renewsAt)
  const graceUntil = parseDate(input.graceUntil)
  if (!startedAt) return { success: false as const, error: 'تاريخ بداية الخطة غير صالح' }

  await prisma.storeSubscription.upsert({
    where: { id: 'singleton' },
    update: {
      planId: plan.id,
      status: input.status,
      startedAt,
      renewsAt,
      graceUntil,
      notes: input.notes.trim() || null,
      updatedBy: 'admin',
    },
    create: {
      id: 'singleton',
      planId: plan.id,
      status: input.status,
      startedAt,
      renewsAt,
      graceUntil,
      notes: input.notes.trim() || null,
      updatedBy: 'admin',
    },
  })

  return { success: true as const }
}

function gigabytesToBytes(value: string) {
  const gigabytes = Number(value)
  if (!Number.isFinite(gigabytes) || gigabytes <= 0) return null
  return BigInt(Math.round(gigabytes * 1024 * 1024 * 1024))
}

function normalizePlanInput(input: {
  name: string
  slug: string
  price: string
  currencyCode: string
  databaseGB: string
  blobGB: string
  bandwidthGB: string
  sortOrder: string
  isActive: boolean
}) {
  const databaseLimitBytes = gigabytesToBytes(input.databaseGB)
  const blobLimitBytes = gigabytesToBytes(input.blobGB)
  const bandwidthLimitBytes = gigabytesToBytes(input.bandwidthGB)
  const price = Number(input.price)
  const sortOrder = Number(input.sortOrder)
  if (!input.name.trim() || !/^[a-z0-9-]+$/.test(input.slug.trim()) || !input.currencyCode.trim() || !databaseLimitBytes || !blobLimitBytes || !bandwidthLimitBytes || !Number.isFinite(price) || price < 0 || !Number.isInteger(sortOrder) || sortOrder < 0) return null
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    price: price.toFixed(2),
    currencyCode: input.currencyCode.trim().toUpperCase(),
    databaseLimitBytes,
    blobLimitBytes,
    bandwidthLimitBytes,
    sortOrder,
    isActive: Boolean(input.isActive),
  }
}

export async function saveUsagePlan(input: {
  id: string
  name: string
  slug: string
  price: string
  currencyCode: string
  databaseGB: string
  blobGB: string
  bandwidthGB: string
  sortOrder: string
  isActive: boolean
}) {
  await verifyAdmin()
  const normalized = normalizePlanInput(input)
  if (!normalized) return { success: false as const, error: 'بيانات الخطة غير صالحة. تحقق من الاسم والسعر والحصص.' }
  const existing = await prisma.usagePlan.findUnique({ where: { id: input.id } })
  if (!existing) return { success: false as const, error: 'الخطة غير موجودة.' }
  const slugOwner = await prisma.usagePlan.findUnique({ where: { slug: normalized.slug } })
  if (slugOwner && slugOwner.id !== input.id) return { success: false as const, error: 'معرّف الخطة مستخدم مسبقًا.' }
  await prisma.usagePlan.update({ where: { id: input.id }, data: normalized })
  return { success: true as const }
}

export async function createUsagePlan(input: {
  name: string
  slug: string
  price: string
  currencyCode: string
  databaseGB: string
  blobGB: string
  bandwidthGB: string
  sortOrder: string
}) {
  await verifyAdmin()
  const normalized = normalizePlanInput({ ...input, isActive: true })
  if (!normalized) return { success: false as const, error: 'بيانات الخطة غير صالحة. تحقق من الاسم والسعر والحصص.' }
  const existing = await prisma.usagePlan.findUnique({ where: { slug: normalized.slug } })
  if (existing) return { success: false as const, error: 'معرّف الخطة مستخدم مسبقًا.' }
  await prisma.usagePlan.create({ data: normalized })
  return { success: true as const }
}

export async function getAnalyticsData() {
  await verifyAdmin()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [todayStats, monthStats, totalStats, contact] = await Promise.all([
      prisma.dailyStats.findUnique({ where: { date: today } }),
      prisma.dailyStats.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { visitorsCount: true, pageViews: true },
      }),
      prisma.dailyStats.aggregate({
        _sum: { visitorsCount: true, pageViews: true },
      }),
      prisma.contactSettings.findUnique({ where: { id: 'singleton' } }),
    ])

    let usage
    try {
      usage = await getUsageSummary()
    } catch (usageError) {
      console.error('Usage summary unavailable; using legacy fallback:', usageError)
      usage = await getLegacyUsageSummary(monthStats._sum.pageViews || 0)
    }

    return {
      success: true as const,
      visits: {
        today: todayStats?.visitorsCount || 0,
        todayViews: todayStats?.pageViews || 0,
        month: monthStats._sum.visitorsCount || 0,
        total: totalStats._sum.visitorsCount || 0,
      },
      usage: {
        fallback: 'fallback' in usage && usage.fallback,
        subscription: { ...usage.subscription, planId: usage.plan.id },
        plan: usage.plan,
        resources: usage.resources.map((resource) => ({
          resource: resource.resource,
          usedBytes: bytesToJSON(resource.usedBytes),
          limitBytes: bytesToJSON(resource.limitBytes),
          source: resource.source,
          confidence: resource.confidence,
        })),
        availablePlans: usage.availablePlans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          price: String(plan.price),
          currencyCode: plan.currencyCode,
          sortOrder: plan.sortOrder,
          isActive: plan.isActive,
          databaseLimitBytes: bytesToJSON(plan.databaseLimitBytes),
          blobLimitBytes: bytesToJSON(plan.blobLimitBytes),
          bandwidthLimitBytes: bytesToJSON(plan.bandwidthLimitBytes),
        })),
      },
      contact: {
        phoneNumber: contact?.showPhoneNumber ? contact.phoneNumber : null,
        whatsappNumber: contact?.showWhatsappNumber ? contact.whatsappNumber : null,
      },
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return { success: false as const, error: 'فشل في جلب الإحصائيات' }
  }
}
