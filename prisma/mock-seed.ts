import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting mock data seed...')

  // 1. Create Collections
  const collectionsData = [
    { name: 'عطور', slug: 'perfumes', imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600' },
    { name: 'مكياج', slug: 'makeup', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600' },
    { name: 'عناية', slug: 'skincare', imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=600' },
    { name: 'أحذية', slug: 'shoes', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600' },
    { name: 'حقائب', slug: 'bags', imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=600' },
  ]

  const createdCollections = []
  for (const c of collectionsData) {
    const exists = await prisma.collection.findUnique({ where: { slug: c.slug } })
    if (exists) {
      createdCollections.push(exists)
    } else {
      const coll = await prisma.collection.create({ data: c })
      createdCollections.push(coll)
    }
  }

  // 2. Create SubCategories
  const subCatsData = [
    { name: 'عطور رجالية', slug: 'men-perfumes', collectionSlug: 'perfumes' },
    { name: 'عطور نسائية', slug: 'women-perfumes', collectionSlug: 'perfumes' },
    { name: 'عطور شرقية', slug: 'oriental-perfumes', collectionSlug: 'perfumes' },
    { name: 'عطور غربية', slug: 'western-perfumes', collectionSlug: 'perfumes' },
    
    { name: 'أحمر شفاه', slug: 'lipsticks', collectionSlug: 'makeup' },
    { name: 'كريم أساس', slug: 'foundation', collectionSlug: 'makeup' },
    { name: 'ظلال عيون', slug: 'eyeshadows', collectionSlug: 'makeup' },
    
    { name: 'عناية بالبشرة', slug: 'skin-care', collectionSlug: 'skincare' },
    { name: 'عناية بالشعر', slug: 'hair-care', collectionSlug: 'skincare' },
    
    { name: 'أحذية نسائية', slug: 'women-shoes', collectionSlug: 'shoes' },
    { name: 'أحذية رجالية', slug: 'men-shoes', collectionSlug: 'shoes' },
    
    { name: 'حقائب نسائية', slug: 'women-bags', collectionSlug: 'bags' },
  ]

  const createdSubCategories = []
  for (const sc of subCatsData) {
    const coll = createdCollections.find(c => c.slug === sc.collectionSlug)
    if (!coll) continue
    
    const exists = await prisma.subCategory.findUnique({ where: { slug: sc.slug } })
    if (exists) {
      createdSubCategories.push(exists)
    } else {
      const subColl = await prisma.subCategory.create({
        data: { name: sc.name, slug: sc.slug, collectionId: coll.id }
      })
      createdSubCategories.push(subColl)
    }
  }

  // 3. Create Products
  const productsData = [
    // Perfumes
    { name: 'عطر Velvet Oud', slug: 'velvet-oud', brand: 'Luxury Scent', price: 299, compareAtPrice: 399, col: 'perfumes', sub: 'oriental-perfumes', img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400' },
    { name: 'عطر Rose Élégance', slug: 'rose-elegance', brand: 'Chanel', price: 450, compareAtPrice: null, col: 'perfumes', sub: 'women-perfumes', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400' },
    { name: 'عطر Noir Extrême', slug: 'noir-extreme', brand: 'Tom Ford', price: 550, compareAtPrice: 600, col: 'perfumes', sub: 'men-perfumes', img: 'https://images.unsplash.com/photo-1615397323184-f3c0ce2f462a?auto=format&fit=crop&q=80&w=400' },
    { name: 'عطر Blue Ocean', slug: 'blue-ocean', brand: 'Dior', price: 320, compareAtPrice: 400, col: 'perfumes', sub: 'western-perfumes', img: 'https://images.unsplash.com/photo-1595535373300-d435108bb6b3?auto=format&fit=crop&q=80&w=400' },
    { name: 'عطر Amber Royal', slug: 'amber-royal', brand: 'Luxury Scent', price: 210, compareAtPrice: null, col: 'perfumes', sub: 'oriental-perfumes', img: 'https://images.unsplash.com/photo-1587017539504-67cfbfd9860b?auto=format&fit=crop&q=80&w=400' },
    
    // Makeup
    { name: 'أحمر شفاه Matte Rose', slug: 'matte-rose-lipstick', brand: 'MAC', price: 120, compareAtPrice: 150, col: 'makeup', sub: 'lipsticks', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=400' },
    { name: 'كريم أساس Natural Glow', slug: 'natural-glow-foundation', brand: 'Fenty Beauty', price: 180, compareAtPrice: null, col: 'makeup', sub: 'foundation', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400' },
    { name: 'Palette Nude Collection', slug: 'nude-palette', brand: 'Huda Beauty', price: 290, compareAtPrice: 350, col: 'makeup', sub: 'eyeshadows', img: 'https://images.unsplash.com/photo-1512496015851-a1dc8a477858?auto=format&fit=crop&q=80&w=400' },
    { name: 'أحمر شفاه Velvet Red', slug: 'velvet-red-lipstick', brand: 'Dior', price: 160, compareAtPrice: null, col: 'makeup', sub: 'lipsticks', img: 'https://images.unsplash.com/photo-1571781526291-c477ebfd024b?auto=format&fit=crop&q=80&w=400' },
    
    // Skincare
    { name: 'سيروم Hyaluronic Glow', slug: 'hyaluronic-glow-serum', brand: 'The Ordinary', price: 85, compareAtPrice: 110, col: 'skincare', sub: 'skin-care', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400' },
    { name: 'غسول رغوي مهدئ', slug: 'calming-foam-cleanser', brand: 'CeraVe', price: 65, compareAtPrice: null, col: 'skincare', sub: 'skin-care', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400' },
    { name: 'كريم ليلي مرطب', slug: 'night-moisture-cream', brand: 'Kiehl\'s', price: 220, compareAtPrice: 280, col: 'skincare', sub: 'skin-care', img: 'https://images.unsplash.com/photo-1611078584551-7f81f9a89c97?auto=format&fit=crop&q=80&w=400' },
    
    // Shoes
    { name: 'حذاء كلاسيكي أنيق', slug: 'classic-elegant-shoes', brand: 'Gucci', price: 950, compareAtPrice: 1200, col: 'shoes', sub: 'women-shoes', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400' },
    { name: 'حذاء رياضي Air Max', slug: 'air-max-sneakers', brand: 'Nike', price: 450, compareAtPrice: 550, col: 'shoes', sub: 'men-shoes', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
    { name: 'حذاء جلدي رسمي', slug: 'formal-leather-shoes', brand: 'Oxford', price: 320, compareAtPrice: null, col: 'shoes', sub: 'men-shoes', img: 'https://images.unsplash.com/photo-1614252235316-cb4676159c36?auto=format&fit=crop&q=80&w=400' },
    
    // Bags
    { name: 'حقيبة كتف جلدية', slug: 'leather-shoulder-bag', brand: 'Prada', price: 1800, compareAtPrice: 2100, col: 'bags', sub: 'women-bags', img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=400' },
    { name: 'حقيبة يد صغيرة أنيقة', slug: 'mini-elegant-bag', brand: 'Chanel', price: 2400, compareAtPrice: null, col: 'bags', sub: 'women-bags', img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=400' },
    { name: 'حقيبة سفر عملية', slug: 'practical-travel-bag', brand: 'LV', price: 3500, compareAtPrice: 4000, col: 'bags', sub: 'women-bags', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400' },
    
    // Additional realistic products to fill grid
    { name: 'ماسكرا كثافة مضاعفة', slug: 'double-volume-mascara', brand: 'Maybelline', price: 45, compareAtPrice: 60, col: 'makeup', sub: 'eyeshadows', img: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400' },
    { name: 'شامبو الأرغان الطبيعي', slug: 'argan-natural-shampoo', brand: 'Moroccanoil', price: 110, compareAtPrice: null, col: 'skincare', sub: 'hair-care', img: 'https://images.unsplash.com/photo-1626015469348-185444a7732a?auto=format&fit=crop&q=80&w=400' },
    { name: 'بلسم مرطب عميق', slug: 'deep-moisture-conditioner', brand: 'Olaplex', price: 135, compareAtPrice: 150, col: 'skincare', sub: 'hair-care', img: 'https://images.unsplash.com/photo-1559132219-c0c45980a3c2?auto=format&fit=crop&q=80&w=400' },
    { name: 'عطر خشب الصندل', slug: 'sandalwood-perfume', brand: 'Tom Ford', price: 680, compareAtPrice: 750, col: 'perfumes', sub: 'men-perfumes', img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400' },
    { name: 'حقيبة ظهر رياضية', slug: 'sports-backpack', brand: 'Nike', price: 190, compareAtPrice: null, col: 'bags', sub: 'women-bags', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400' },
    { name: 'حذاء جري خفيف', slug: 'light-running-shoes', brand: 'Adidas', price: 380, compareAtPrice: 420, col: 'shoes', sub: 'women-shoes', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' }
  ]

  let count = 0
  for (const p of productsData) {
    const coll = createdCollections.find(c => c.slug === p.col)
    const sub = createdSubCategories.find(s => s.slug === p.sub)
    if (!coll || !sub) continue

    const exists = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (!exists) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          collectionId: coll.id,
          subCategoryId: sub.id,
          imageUrl: p.img,
          stock: 100,
          isActive: true
        }
      })
      count++
    }
  }

  console.log(`✅ Seed completed! Inserted ${count} new mock products.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
