import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const perfumeImages = [
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590736704728-f4730bb30770?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594032194509-0056023973b2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615397323863-1284d7b27fc5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582211594533-25b73c890f07?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512496015851-a1cbfacabfb4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595425970377-c9703bc48baf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1589132549241-155e9ba423f8?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608528577891-eb055944f2e7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615529182559-0785f8abf66c?q=80&w=800&auto=format&fit=crop',
];

async function main() {
  const categories = [
    { name: 'عطور صيفية', slug: 'summer-perfumes', desc: 'مجموعة منعشة تناسب أجواء الصيف الحارة' },
    { name: 'عطور شتوية', slug: 'winter-perfumes', desc: 'عطور دافئة ومميزة تمنحك الدفء في ليالي الشتاء' },
    { name: 'عطور فرنسية', slug: 'french-perfumes', desc: 'الأناقة الفرنسية في زجاجة عطر' },
    { name: 'دهن العود', slug: 'oud-oil', desc: 'أصالة العود الشرقي الفاخر' },
    { name: 'مسك وعنبر', slug: 'musk-amber', desc: 'مزيج ساحر من المسك والعنبر الصافي' },
    { name: 'عطور النيش', slug: 'niche-perfumes', desc: 'عطور حصرية ونادرة لأصحاب الذوق الرفيع' },
    { name: 'مجموعات الهدايا', slug: 'gift-sets', desc: 'أرقى الهدايا لمن تحب' },
    { name: 'عطور الشعر', slug: 'hair-mists', desc: 'عطور لطيفة ومخصصة للشعر' },
    { name: 'عطور المنزل', slug: 'home-fragrances', desc: 'لجعل منزلك يفوح بأجمل الروائح' },
    { name: 'إصدارات محدودة', slug: 'limited-editions', desc: 'إصدارات حصرية متوفرة لفترة محدودة' },
  ];

  console.log('Updating 10 categories and 100 products with diverse images...');

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    
    // Pick a random image for the category
    const catImage = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    
    // Create or update collection
    const collection = await prisma.collection.upsert({
      where: { slug: cat.slug },
      update: { imageUrl: catImage },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.desc,
        imageUrl: catImage,
        isActive: true,
      },
    });

    console.log(`Updated category: ${collection.name}`);

    // Create or update 10 products for this category
    for (let j = 1; j <= 10; j++) {
      const productSlug = `${cat.slug}-product-${j}`;
      const productName = `${cat.name} - عطر تجريبي ${j}`;
      const price = 150 + Math.floor(Math.random() * 500); 
      
      const productImage1 = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
      const productImage2 = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];

      await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          imageUrl: productImage1,
          images: [productImage1, productImage2],
        },
        create: {
          name: productName,
          slug: productSlug,
          description: `هذا وصف تجريبي للعطر ${productName} مخصص للعرض فقط.`,
          price: price,
          compareAtPrice: Math.random() > 0.5 ? price + 100 : null,
          category: collection.name,
          collectionId: collection.id,
          imageUrl: productImage1,
          images: [productImage1, productImage2],
          stock: 50,
          isActive: true,
          gender: Math.random() > 0.5 ? 'للجنسين' : (Math.random() > 0.5 ? 'رجالي' : 'نسائي'),
          featured: Math.random() > 0.8,
          bestseller: Math.random() > 0.8,
        },
      });
    }
  }

  console.log('✅ Demo data updated successfully with diverse images!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
