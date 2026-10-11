import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- بدء إضافة 6 حقائب نسائية ---')

  // 1. البحث عن قسم الحقائب أو إنشاؤه
  let collection = await prisma.collection.findFirst({
    where: {
      OR: [
        { slug: 'bags' },
        { slug: 'handbags' },
        { name: { contains: 'حقائب' } },
        { name: { contains: 'حقائب نسائية' } },
        { name: { contains: 'الحقائب' } }
      ]
    }
  })

  if (!collection) {
    console.log('لم يتم العثور على قسم الحقائب، جاري إنشاؤه...')
    collection = await prisma.collection.create({
      data: {
        name: 'حقائب',
        slug: 'bags',
        description: 'تشكيلة راقية من الحقائب النسائية الأنيقة والعصرية.',
        isActive: true
      }
    })
    console.log(`تم إنشاء القسم: ${collection.name} (${collection.id})`)
  } else {
    console.log(`تم العثور على القسم: ${collection.name} (${collection.id})`)
  }

  const count = 6
  const createdProducts = []
  const timestamp = Date.now()

  for (let i = 1; i <= count; i++) {
    const uniqueSuffix = `${timestamp}-${i}`
    const sku = `BAG-W-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${i}`
    const slug = `womens-bag-${uniqueSuffix}`

    const product = await prisma.product.create({
      data: {
        name: 'حقيبة نسائية أنيقة',
        slug: slug,
        sku: sku,
        brand: 'بسمة أناقة',
        description: 'حقيبة نسائية أنيقة بتصميم عصري وخامة راقية تناسب مختلف الإطلالات والمناسبات.',
        price: 3000,
        compareAtPrice: 4000,
        collectionId: collection.id,
        category: collection.name,
        gender: 'نسائي',
        hasSizes: false,
        availableSizes: [],
        stock: 20,
        isActive: true
      }
    })

    createdProducts.push(product)
    console.log(`[${i}/6] تم إنشاء المنتج بنجاح: ID: ${product.id} | Name: ${product.name} | Slug: ${product.slug}`)
  }

  console.log('====================================')
  console.log(` اكتملت العملية بنجاح! تم إنشاء ${createdProducts.length} حقائب بنجاح.`)
  console.log('====================================')
}

main()
  .catch((e) => {
    console.error('حدث خطأ أثناء الإضافة:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
