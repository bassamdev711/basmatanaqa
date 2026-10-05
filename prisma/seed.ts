import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      storeName: process.env.STORE_NAME?.trim() || 'متجرك',
      storeNameLatin: process.env.STORE_NAME_LATIN?.trim() || 'YOUR STORE',
      storeTagline: process.env.STORE_TAGLINE?.trim() || 'منتجات مختارة بعناية، وتجربة تستحق التذكر.',
      storeDescription: process.env.STORE_DESCRIPTION?.trim() || 'اكتشف مجموعة مختارة من المنتجات مع تجربة تسوق واضحة وآمنة ومصممة لعلامتك التجارية.',
      locale: process.env.STORE_LOCALE?.trim() || 'ar',
      currencyCode: process.env.STORE_CURRENCY?.trim().toUpperCase() || 'USD',
      storeUrl: process.env.STORE_URL?.trim() || null,
    },
  })

  const shippingCityCount = await prisma.shippingCity.count()
  if (shippingCityCount === 0) {
    await prisma.shippingCity.create({
      data: { name: 'إب', shippingFee: 0, isActive: true },
    })
    console.log('Created default shipping city: إب')
  }

  if (process.env.SEED_DEMO_DATA !== 'true') {
    console.log('Demo catalog skipped. Set SEED_DEMO_DATA=true to add sample products.')
    return
  }

  const demoProducts = [
    {
      name: 'منتج تجريبي أساسي',
      slug: 'demo-product-basic',
      brand: 'YOUR BRAND',
      description: 'منتج تجريبي قابل للاستبدال من لوحة التحكم.',
      price: 10,
      stock: 25,
      isActive: true,
      category: 'General',
      gender: 'Unisex',
      size: 'Standard',
      featured: true,
      bestseller: false,
    },
    {
      name: 'منتج تجريبي مميز',
      slug: 'demo-product-featured',
      brand: 'YOUR BRAND',
      description: 'مثال عام لمنتج مميز في المتجر.',
      price: 25,
      stock: 15,
      isActive: true,
      category: 'Featured',
      gender: 'Unisex',
      size: 'Standard',
      featured: true,
      bestseller: true,
    },
  ]

  for (const product of demoProducts) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
    console.log(`Created demo product: ${createdProduct.id}`)
  }

  console.log('Database seed finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
