import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function check() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true, images: true },
  })

  let blobCount = 0
  let r2Count = 0
  let otherCount = 0

  for (const p of products) {
    const urls = [p.imageUrl, ...(p.images || [])].filter(Boolean)
    const hasBlob = urls.some(u => u.includes('blob.vercel-storage.com'))
    const hasR2 = urls.some(u => u.includes('r2.dev'))
    if (hasBlob) blobCount++
    else if (hasR2) r2Count++
    else otherCount++
  }

  console.log(`Total Products: ${products.length}`)
  console.log(`Already on R2: ${r2Count}`)
  console.log(`Still on Vercel Blob: ${blobCount}`)
  console.log(`Other/None: ${otherCount}`)
}

check().finally(() => prisma.$disconnect())
