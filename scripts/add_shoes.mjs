import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- بدء إضافة 10 أحذية نسائية ---')

  // 1. البحث عن قسم الأحذية أو إنشاؤه
  let collection = await prisma.collection.findFirst({
    where: {
      OR: [
        { slug: 'shoes' },
        { name: { contains: 'أحذية' } },
        { name: { contains: 'احذية' } }
      ]
    }
  })

  if (!collection) {
    console.log('لم يتم العثور على قسم الأحذية، جاري إنشاؤه...')
    collection = await prisma.collection.create({
      data: {
        name: 'أحذية',
        slug: 'shoes',
        description: 'أحذية نسائية فاخرة تجمع بين الأناقة والراحة.',
        isActive: true
      }
    })
    console.log(`تم إنشاء القسم: ${collection.name} (${collection.id})`)
  } else {
    console.log(`تم العثور على القسم: ${collection.name} (${collection.id})`)
  }

  const sizes = ['36', '37', '38', '39', '40']
  const count = 10
  const createdProducts = []

  const timestamp = Date.now()

  for (let i = 1; i <= count; i++) {
    const uniqueSuffix = `${timestamp}-${i}`
    const sku = `SHOE-W-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${i}`
    const slug = `womens-shoes-${uniqueSuffix}`

    const product = await prisma.product.create({
      data: {
        name: 'حذاء نسائي',
        slug: slug,
        sku: sku,
        brand: 'بسمة أناقة',
        description: 'حذاء نسائي أنيق وعصري بجودة ممتازة وخامة مريحة للقدمين.',
        price: 3500,
        compareAtPrice: 4500,
        collectionId: collection.id,
        category: collection.name,
        gender: 'نسائي',
        hasSizes: true,
        availableSizes: sizes,
        stock: 50,
        isActive: true,
        variants: {
          create: sizes.map((size) => ({
            size: size,
            price: 3500,
            compareAtPrice: 4500,
            stock: 10,
          }))
        }
      }
    })

    createdProducts.push(product)
    console.log(`[${i}/10] تم إنشاء المنتج بنجاح: ID: ${product.id} | Slug: ${product.slug}`)
  }

  console.log('====================================')
  console.log(` اكتملت العملية بنجاح! تم إنشاء ${createdProducts.length} منتجات بنجاح.`)
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
