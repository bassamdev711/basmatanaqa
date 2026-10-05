import { list, type PutCommandOptions } from '@vercel/blob'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createAdminNotification } from '@/lib/admin-notifications'

const MB = BigInt(1024) * BigInt(1024)
const GB = BigInt(1024) * MB
const RESERVATION_TTL_MS = 10 * 60 * 1000

export const USAGE_RESOURCES = ['database', 'blob', 'bandwidth'] as const
export type UsageResource = (typeof USAGE_RESOURCES)[number]

export type UsageLevel = 'normal' | 'info' | 'warning' | 'critical' | 'exceeded'

export class UsageLimitError extends Error {
  resource: UsageResource
  usedBytes: bigint
  limitBytes: bigint

  constructor(resource: UsageResource, usedBytes: bigint, limitBytes: bigint) {
    super('USAGE_LIMIT_EXCEEDED')
    this.name = 'UsageLimitError'
    this.resource = resource
    this.usedBytes = usedBytes
    this.limitBytes = limitBytes
  }
}

/**
 * The usage migration is deployed independently from the application code.
 * Until it exists in production, uploads must remain available instead of
 * failing before the Vercel Blob request is made. Once the tables exist, all
 * uploads continue through the normal quota reservation path.
 */
function isUsageSchemaUnavailable(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (code === 'P2021' || code === 'P2022') return true
  }

  const message = error instanceof Error ? error.message : String(error)
  return /(UsagePlan|StoreSubscription|UsageSnapshot|StorageObject|relation .* does not exist|table .* does not exist)/i.test(message)
}

export function getUsageLevel(usedBytes: bigint, limitBytes: bigint): UsageLevel {
  if (limitBytes <= BigInt(0)) return 'normal'
  const percentage = Number((usedBytes * BigInt(10000)) / limitBytes) / 100
  if (percentage >= 100) return 'exceeded'
  if (percentage >= 95) return 'critical'
  if (percentage >= 85) return 'warning'
  if (percentage >= 70) return 'info'
  return 'normal'
}

export function toBytes(value: number | bigint): bigint {
  return typeof value === 'bigint' ? value : BigInt(Math.max(0, Math.round(value)))
}

export function bytesToGB(value: bigint): number {
  return Number(value) / Number(GB)
}

export function bytesToMB(value: bigint): number {
  return Number(value) / Number(MB)
}

export function bytesToJSON(value: bigint): number {
  return Number(value)
}

export function getMonthStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function inferBlobKind(pathname: string): string {
  if (pathname.startsWith('products/')) return 'product'
  if (pathname.startsWith('branding/')) return 'branding'
  if (pathname.startsWith('receipts/')) return 'receipt'
  return 'other'
}

async function listAllBlobs() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null

  try {
    const blobs: Array<{ url: string; pathname: string; size: number }> = []
    let cursor: string | undefined

    do {
      const result = await list({ token, limit: 1000, ...(cursor ? { cursor } : {}) })
      blobs.push(...result.blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
      })))
      cursor = result.hasMore ? result.cursor : undefined
    } while (cursor)

    return blobs
  } catch (error) {
    console.warn('Could not reconcile Vercel Blob registry:', error)
    return null
  }
}

/**
 * Reconciles the local registry with Vercel Blob when the token is available.
 * This makes legacy files count toward the quota instead of starting at zero.
 */
export async function reconcileBlobRegistry() {
  const blobs = await listAllBlobs()
  if (!blobs) return null

  const now = new Date()
  for (const blob of blobs) {
    await prisma.storageObject.upsert({
      where: { url: blob.url },
      update: {
        storageKey: blob.pathname,
        sizeBytes: BigInt(Math.max(0, Math.round(blob.size))),
        kind: inferBlobKind(blob.pathname),
        isDeleted: false,
        reservedUntil: null,
        deletedAt: null,
      },
      create: {
        url: blob.url,
        storageKey: blob.pathname,
        sizeBytes: BigInt(Math.max(0, Math.round(blob.size))),
        kind: inferBlobKind(blob.pathname),
      },
    })
  }

  const urls = blobs.map((blob) => blob.url)
  await prisma.storageObject.updateMany({
    where: {
      isDeleted: false,
      kind: { not: 'reservation' },
      ...(urls.length ? { url: { notIn: urls } } : {}),
    },
    data: { isDeleted: true, deletedAt: now },
  })

  return {
    totalBytes: blobs.reduce((total, blob) => total + BigInt(Math.max(0, Math.round(blob.size))), BigInt(0)),
    blobs,
  }
}

async function getTrackedBlobBytes(): Promise<bigint> {
  const result = await prisma.storageObject.aggregate({
    where: {
      isDeleted: false,
      OR: [
        { kind: { not: 'reservation' } },
        { kind: 'reservation', reservedUntil: { gt: new Date() } },
      ],
    },
    _sum: { sizeBytes: true },
  })
  return result._sum.sizeBytes ?? BigInt(0)
}

export async function getDatabaseBytes(): Promise<{ bytes: bigint; source: string; confidence: string }> {
  try {
    const result = await prisma.$queryRaw<Array<{ size: bigint | number | string }>>`SELECT pg_database_size(current_database()) as size`
    const value = result[0]?.size
    if (value !== undefined && value !== null) {
      return { bytes: BigInt(value), source: 'postgres.pg_database_size', confidence: 'measured' }
    }
  } catch (error) {
    console.warn('Could not measure PostgreSQL database size:', error)
  }
  return { bytes: BigInt(0), source: 'unavailable', confidence: 'unavailable' }
}

export async function ensureUsageDefaults() {
  const freePlan = await prisma.usagePlan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'الخطة المجانية',
      slug: 'free',
      price: 0,
      currencyCode: 'USD',
      databaseLimitBytes: BigInt(512) * MB,
      blobLimitBytes: BigInt(1) * GB,
      bandwidthLimitBytes: BigInt(100) * GB,
      sortOrder: 0,
    },
  })

  const current = await prisma.storeSubscription.findUnique({
    where: { id: 'singleton' },
    include: { plan: true },
  })

  if (!current) {
    return prisma.storeSubscription.create({
      data: { id: 'singleton', planId: freePlan.id },
      include: { plan: true },
    })
  }

  if (!current.planId || !current.plan) {
    return prisma.storeSubscription.update({
      where: { id: 'singleton' },
      data: { planId: freePlan.id },
      include: { plan: true },
    })
  }

  return current
}

export async function getUsageSummary() {
  const subscription = await ensureUsageDefaults()
  const plan = subscription.plan ?? await prisma.usagePlan.findUniqueOrThrow({ where: { slug: 'free' } })
  const remoteBlobUsage = await reconcileBlobRegistry()
  const blobBytes = remoteBlobUsage?.totalBytes ?? await getTrackedBlobBytes()
  const database = await getDatabaseBytes()
  const today = new Date()
  const startOfMonth = getMonthStart(today)
  const monthStats = await prisma.dailyStats.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { pageViews: true },
  })
  const estimatedBandwidthBytes = BigInt(Math.max(0, Math.round((monthStats._sum.pageViews || 0) * 0.002 * Number(GB))))
  const blobSource = remoteBlobUsage ? 'vercel-blob.list' : 'local-storage-registry'
  const blobConfidence = remoteBlobUsage ? 'measured' : 'tracked'

  const resources = [
    { resource: 'database', usedBytes: database.bytes, limitBytes: plan.databaseLimitBytes, source: database.source, confidence: database.confidence },
    { resource: 'blob', usedBytes: blobBytes, limitBytes: plan.blobLimitBytes, source: blobSource, confidence: blobConfidence },
    { resource: 'bandwidth', usedBytes: estimatedBandwidthBytes, limitBytes: plan.bandwidthLimitBytes, source: 'estimated-from-pageviews', confidence: 'estimated' },
  ] as const

  await Promise.all(resources.map((item) => prisma.usageSnapshot.upsert({
    where: { resource_periodStart: { resource: item.resource, periodStart: startOfMonth } },
    update: {
      usedBytes: item.usedBytes,
      limitBytes: item.limitBytes,
      source: item.source,
      confidence: item.confidence,
      measuredAt: new Date(),
    },
    create: {
      resource: item.resource,
      periodStart: startOfMonth,
      usedBytes: item.usedBytes,
      limitBytes: item.limitBytes,
      source: item.source,
      confidence: item.confidence,
    },
  })))

  const thresholds = [70, 85, 95, 100]
  await Promise.all(resources.map(async (item) => {
    const percentage = item.limitBytes > BigInt(0) ? Number((item.usedBytes * BigInt(10000)) / item.limitBytes) / 100 : 0
    const threshold = thresholds.filter((value) => percentage >= value).at(-1)
    if (!threshold) return
    const label = item.resource === 'database' ? 'قاعدة البيانات' : item.resource === 'blob' ? 'الصور والملفات' : 'نقل البيانات'
    const title = threshold >= 100 ? `تم بلوغ حصة ${label}` : `اقتربت حصة ${label} من النفاذ`
    await createAdminNotification({
      type: 'limit',
      title,
      body: threshold >= 100
        ? `تم بلوغ ${label} في الخطة الحالية. سيستمر المتجر بالعمل، وسيتم إيقاف الرفع الجديد عند الحاجة.`
        : `استهلاك ${label} وصل إلى ${percentage.toFixed(1)}%. يمكنك التواصل مع المالك للترقية قبل بلوغ الحد.`,
      url: '/admin/analytics',
      dedupeKey: `usage:${startOfMonth.toISOString()}:${item.resource}:${threshold}`,
    })
  }))

  return {
    subscription: {
      status: subscription.status,
      startedAt: subscription.startedAt,
      renewsAt: subscription.renewsAt,
      graceUntil: subscription.graceUntil,
      notes: subscription.notes,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: String(plan.price),
      currencyCode: plan.currencyCode,
    },
    resources,
    availablePlans: await prisma.usagePlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currencyCode: true,
        sortOrder: true,
        isActive: true,
        databaseLimitBytes: true,
        blobLimitBytes: true,
        bandwidthLimitBytes: true,
      },
    }),
  }
}

export async function reserveBlobSpace(bytes: number, kind: string) {
  const requestedBytes = toBytes(bytes)
  const subscription = await ensureUsageDefaults()
  const plan = subscription.plan ?? await prisma.usagePlan.findUniqueOrThrow({ where: { slug: 'free' } })
  await reconcileBlobRegistry()

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(814729)`
    const activeBytes = await tx.storageObject.aggregate({
      where: {
        isDeleted: false,
        OR: [
          { kind: { not: 'reservation' } },
          { kind: 'reservation', reservedUntil: { gt: new Date() } },
        ],
      },
      _sum: { sizeBytes: true },
    })
    const usedBytes = activeBytes._sum.sizeBytes ?? BigInt(0)
    if (usedBytes + requestedBytes > plan.blobLimitBytes) {
      throw new UsageLimitError('blob', usedBytes, plan.blobLimitBytes)
    }

    const reservationUrl = `reservation:${crypto.randomUUID()}`
    await tx.storageObject.create({
      data: {
        url: reservationUrl,
        storageKey: kind,
        sizeBytes: requestedBytes,
        kind: 'reservation',
        reservedUntil: new Date(Date.now() + RESERVATION_TTL_MS),
      },
    })
    return reservationUrl
  })
}

export async function finalizeBlobReservation(reservationUrl: string, blob: { url: string; pathname: string }, sizeBytes: number, kind: string) {
  await prisma.storageObject.update({
    where: { url: reservationUrl },
    data: {
      url: blob.url,
      storageKey: blob.pathname,
      sizeBytes: toBytes(sizeBytes),
      kind,
      reservedUntil: null,
    },
  })
}

export async function releaseBlobReservation(reservationUrl: string) {
  await prisma.storageObject.deleteMany({ where: { url: reservationUrl } })
}

export async function markBlobDeleted(url: string) {
  await prisma.storageObject.updateMany({
    where: { url },
    data: { isDeleted: true, deletedAt: new Date(), reservedUntil: null },
  })
}

type BlobBody = Parameters<typeof import('@vercel/blob').put>[1]

export async function putTrackedBlob(
  pathname: string,
  body: BlobBody,
  options: PutCommandOptions,
  kind: string,
  sizeBytes: number,
) {
  let reservationUrl: string

  try {
    reservationUrl = await reserveBlobSpace(sizeBytes, kind)
  } catch (error) {
    if (!isUsageSchemaUnavailable(error)) throw error

    console.warn('Usage tables are unavailable; uploading to Vercel Blob without local quota bookkeeping.')
    const { put } = await import('@vercel/blob')
    return put(pathname, body, options)
  }

  let uploadedUrl: string | undefined
  try {
    const { put } = await import('@vercel/blob')
    const blob = await put(pathname, body, options)
    uploadedUrl = blob.url
    await finalizeBlobReservation(reservationUrl, { url: blob.url, pathname: blob.pathname }, sizeBytes, kind)
    return blob
  } catch (error) {
    if (uploadedUrl) {
      try {
        const { del } = await import('@vercel/blob')
        await del(uploadedUrl, { token: options.token })
        await markBlobDeleted(uploadedUrl)
      } catch (cleanupError) {
        console.error('Failed to clean up unregistered Blob:', cleanupError)
      }
    }
    await releaseBlobReservation(reservationUrl)
    throw error
  }
}
