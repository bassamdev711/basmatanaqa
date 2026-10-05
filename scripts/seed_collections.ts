import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const collections = [
    { name: 'ملابس', slug: 'clothing', description: 'قطع مختارة للظهور اليومي والمناسبات.', imageUrl: null, isActive: true },
    { name: 'أحذية', slug: 'shoes', description: 'أحذية تجمع بين الراحة والأناقة لكل خطوة.', imageUrl: null, isActive: true },
    { name: 'حقائب', slug: 'bags', description: 'حقائب عملية وراقية تكمل أسلوبك.', imageUrl: null, isActive: true },
    { name: 'إكسسوارات', slug: 'accessories', description: 'تفاصيل صغيرة تصنع فرقًا كبيرًا في إطلالتك.', imageUrl: null, isActive: true },
    { name: 'تجميل', slug: 'makeup', description: 'اختيارات تجميل تضيف لمسة متألقة إلى إطلالتك.', imageUrl: null, isActive: true },
    { name: 'عطور', slug: 'fragrances', description: 'روائح مختارة تضيف حضورًا لا يُنسى.', imageUrl: null, isActive: true },
    { name: 'عناية وجمال', slug: 'beauty-care', description: 'منتجات للعناية بالبشرة والشعر والجمال اليومي.', imageUrl: null, isActive: true },
    { name: 'هدايا', slug: 'gifts', description: 'أفكار أنيقة للمناسبات واللحظات الخاصة.', imageUrl: null, isActive: true },
  ]

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        description: collection.description,
        isActive: collection.isActive,
      },
      create: collection,
    })
  }

  console.log('Basmat Anaqah collections seeded successfully!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
