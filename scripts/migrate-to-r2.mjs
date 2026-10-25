import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME || 'shahrazad-storage'
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')

if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
  console.error('❌ Cloudflare R2 credentials missing in environment.')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const urlCache = new Map()

async function withRetry(fn, retries = 5, delayMs = 2000) {
  let attempt = 0
  while (attempt < retries) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= retries) throw err
      console.warn(`[DB Retry ${attempt}/${retries}] Retrying after error: ${err.message}`)
      await new Promise(r => setTimeout(r, delayMs * attempt))
    }
  }
}

async function uploadBufferToR2(key, buffer, contentType) {
  const cleanKey = key.replace(/^\/+/, '')
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  return `${publicUrl}/${cleanKey}`
}

async function migrateUrl(oldUrl, kindHint = 'products') {
  if (!oldUrl || !oldUrl.includes('blob.vercel-storage.com')) {
    return oldUrl
  }

  if (urlCache.has(oldUrl)) {
    return urlCache.get(oldUrl)
  }

  try {
    const res = await fetch(oldUrl, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      console.warn(`[Skip] HTTP ${res.status} for ${oldUrl}`)
      return oldUrl
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let key = new URL(oldUrl).pathname.replace(/^\/+/, '')
    if (!key) {
      key = `${kindHint}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    }

    const newUrl = await uploadBufferToR2(key, buffer, contentType)
    urlCache.set(oldUrl, newUrl)
    return newUrl
  } catch (err) {
    console.error(`[Error] ${oldUrl}: ${err.message}`)
    return oldUrl
  }
}

async function runWithConcurrency(items, limit, fn) {
  const results = []
  const executing = []
  let index = 0
  const total = items.length

  for (const item of items) {
    const currentIdx = ++index
    const p = Promise.resolve().then(() => fn(item, currentIdx, total))
    results.push(p)

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= limit) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(results)
}

async function main() {
  console.log('🚀 Fast parallel migration starting (with auto-reconnect)...')

  const products = await withRetry(() => prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true, images: true },
  }))

  const productsToMigrate = products.filter(p => {
    const mainHas = p.imageUrl && p.imageUrl.includes('blob.vercel-storage.com')
    const imgsHas = Array.isArray(p.images) && p.images.some(img => img && img.includes('blob.vercel-storage.com'))
    return mainHas || imgsHas
  })

  console.log(`📦 Remaining products to migrate: ${productsToMigrate.length}`)

  let count = 0
  await runWithConcurrency(productsToMigrate, 4, async (product, idx, total) => {
    let changed = false
    let newImageUrl = product.imageUrl
    const newImages = []

    if (product.imageUrl && product.imageUrl.includes('blob.vercel-storage.com')) {
      newImageUrl = await migrateUrl(product.imageUrl, 'products')
      if (newImageUrl !== product.imageUrl) changed = true
    }

    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && img.includes('blob.vercel-storage.com')) {
          const migrated = await migrateUrl(img, 'products')
          newImages.push(migrated)
          if (migrated !== img) changed = true
        } else {
          newImages.push(img)
        }
      }
    }

    if (changed) {
      await withRetry(() => prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: newImageUrl,
          images: newImages,
        },
      }))
      count++
      if (count % 15 === 0 || count === total) {
        console.log(`[Progress] Migrated ${count}/${total} products...`)
      }
    }
  })

  // 2. SubCategories
  const subCategories = await withRetry(() => prisma.subCategory.findMany({
    where: { imageUrl: { contains: 'blob.vercel-storage.com' } },
  }))
  for (const sc of subCategories) {
    if (sc.imageUrl) {
      const newUrl = await migrateUrl(sc.imageUrl, 'subcategories')
      if (newUrl !== sc.imageUrl) {
        await withRetry(() => prisma.subCategory.update({
          where: { id: sc.id },
          data: { imageUrl: newUrl },
        }))
      }
    }
  }

  // 3. Orders
  const orders = await withRetry(() => prisma.order.findMany({
    where: { paymentProofUrl: { contains: 'blob.vercel-storage.com' } },
  }))
  for (const o of orders) {
    if (o.paymentProofUrl) {
      const newUrl = await migrateUrl(o.paymentProofUrl, 'receipts')
      if (newUrl !== o.paymentProofUrl) {
        await withRetry(() => prisma.order.update({
          where: { id: o.id },
          data: { paymentProofUrl: newUrl },
        }))
      }
    }
  }

  console.log(`\n🎉 Finished! Successfully completed migration of ${count} products to Cloudflare R2!`)
}

main()
  .catch((e) => console.error('Migration error:', e))
  .finally(() => prisma.$disconnect())
