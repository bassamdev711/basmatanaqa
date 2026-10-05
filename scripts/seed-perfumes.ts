import 'dotenv/config'
process.env.DATABASE_URL = process.env.DIRECT_URL
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')
  // Clean up order items and reviews if there's any relation issues, but since it's a seed, we clean up what we touch
  await prisma.orderItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.collection.deleteMany()

  console.log('Setting currency to ر.ي...')
  await prisma.paymentSettings.upsert({
    where: { id: 'singleton' },
    update: { currency: 'ر.ي' },
    create: { id: 'singleton', currency: 'ر.ي' }
  })

  console.log('Creating Collections (Categories)...')
  const men = await prisma.collection.create({
    data: {
      name: 'عطور رجالية',
      slug: 'men',
      description: 'مجموعة من العطور الرجالية الفاخرة التي تعكس القوة والجاذبية.',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
      isActive: true,
    }
  })

  const women = await prisma.collection.create({
    data: {
      name: 'عطور نسائية',
      slug: 'women',
      description: 'عطور نسائية راقية تمنحك حضوراً ساحراً وأنوثة لا تُنسى.',
      imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600&auto=format&fit=crop',
      isActive: true,
    }
  })

  const oriental = await prisma.collection.create({
    data: {
      name: 'عطور شرقية',
      slug: 'oriental',
      description: 'أصالة الشرق في زجاجة، نفحات من العود والمسك والعنبر.',
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
      isActive: true,
    }
  })

  const niche = await prisma.collection.create({
    data: {
      name: 'عطور نيش',
      slug: 'niche',
      description: 'عطور نادرة واستثنائية لأصحاب الذوق الرفيع والمتميز.',
      imageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=600&auto=format&fit=crop',
      isActive: true,
    }
  })

  console.log('Creating Products...')
  await prisma.product.create({
    data: {
      name: 'أمير الصحراء',
      slug: 'desert-prince',
      description: 'عطر رجالي يجمع بين عبق التوابل الشرقية ونفحات الأخشاب النادرة، مصمم للرجل الذي يبحث عن التفرد.',
      price: 25000,
      compareAtPrice: 30000,
      collectionId: men.id,
      stock: 50,
      isActive: true,
      featured: true,
      bestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=800&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=800&auto=format&fit=crop'
      ]
    }
  })

  await prisma.product.create({
    data: {
      name: 'ليالي الشرق',
      slug: 'oriental-nights',
      description: 'مزيج ساحر من العود الأصلي والعنبر والورد الدمشقي، عطر يأخذك في رحلة إلى سحر الشرق الجميل.',
      price: 45000,
      compareAtPrice: 55000,
      collectionId: oriental.id,
      stock: 30,
      isActive: true,
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop'
      ]
    }
  })

  await prisma.product.create({
    data: {
      name: 'زهور الربيع',
      slug: 'spring-flowers',
      description: 'باقة من أجمل زهور الياسمين والزنبق والورد، تمنحك شعوراً بالانتعاش والأنوثة طوال اليوم.',
      price: 22000,
      compareAtPrice: 28000,
      collectionId: women.id,
      stock: 100,
      isActive: true,
      bestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop'
      ]
    }
  })

  await prisma.product.create({
    data: {
      name: 'بلاك مسك',
      slug: 'black-musk',
      description: 'تركيبة غامضة وجذابة تعتمد على المسك الأسود النقي بلمسات عصرية تضفي هالة من الفخامة.',
      price: 60000,
      compareAtPrice: 70000,
      collectionId: niche.id,
      stock: 15,
      isActive: true,
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1610461888750-10bfc601b874?q=80&w=800&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1610461888750-10bfc601b874?q=80&w=800&auto=format&fit=crop'
      ]
    }
  })

  await prisma.product.create({
    data: {
      name: 'العود الملكي',
      slug: 'royal-oud',
      description: 'خلاصة دهن العود المعتق، مقدمة في زجاجة فاخرة لمن يبحثون عن الكلاسيكية والتميز المطلق.',
      price: 85000,
      compareAtPrice: 100000,
      collectionId: oriental.id,
      stock: 10,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop'
      ]
    }
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
