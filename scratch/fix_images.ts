import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const validIds = [
  '1585386959984-a4155224a1ad',
  '1629198688000-71f23e745b6e',
  '1588405748880-12d1d2a59f75',
  '1610461888750-10bfc601b874',
  '1594035910387-fea47794261f',
  '1590736969955-71cc94801759',
  '1620916566398-39f1143ab7be',
  '1582211594533-268f4f1edcb9'
];

const perfumeImages = validIds.map(id => `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`);

async function main() {
  const products = await prisma.product.findMany({ select: { id: true }});
  
  console.log(`Fixing images for ${products.length} products...`);
  
  for (const product of products) {
    const randomImage = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    const randomImage2 = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    const randomImage3 = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: randomImage,
        images: [randomImage, randomImage2, randomImage3]
      }
    });
  }
  
  const collections = await prisma.collection.findMany({ select: { id: true }});
  console.log(`Fixing images for ${collections.length} collections...`);
  
  for (const collection of collections) {
    const randomImage = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    await prisma.collection.update({
      where: { id: collection.id },
      data: { imageUrl: randomImage }
    });
  }
  
  console.log('Finished fixing images!');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
