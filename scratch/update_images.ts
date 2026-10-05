import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const perfumeImages = [
  '1585386959984-a4155224a1ad',
  '1629198688000-71f23e745b6e',
  '1588405748880-12d1d2a59f75',
  '1610461888750-10bfc601b874',
  '1594035910387-fea47794261f',
  '1592945403244-33230a3b0227',
  '1590736969955-71cc94801759',
  '1541643600914-7228ec56c71a',
  '1605553535948-439561081a25',
  '1595425983754-0466336e4f16',
  '1572282255745-779cf32da0e2',
  '1557353425-6c61136ce0cd',
  '1609357604470-3d7122e1b12b',
  '1595425984461-8686d0b30bb6',
  '1566955095384-722a445cb481',
  '1615397323861-125c117d6537',
  '1594035911475-6d0426b3b55c',
  '1601049544431-1e9bf43493e8',
  '1620916566398-39f1143ab7be',
  '1582211594533-268f4f1edcb9',
  '1616683693454-3e9a4f6645db',
  '1615631245831-29e1eb1da19f',
  '1594035911221-df3f707f4a21',
  '1583088580009-8d1976007e03',
  '1596462502278-27bf85033c41',
  '1615397323861-125c117d6537',
  '1592945403244-33230a3b0227',
  '1590736969955-71cc94801759',
  '1526685813351-408990cf49da'
].map(id => `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`);

async function main() {
  const products = await prisma.product.findMany({ select: { id: true }});
  
  console.log(`Updating ${products.length} products with random images...`);
  
  for (const product of products) {
    const randomImage = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    // Add multiple images for the gallery as well
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
  console.log(`Updating ${collections.length} collections with random images...`);
  
  for (const collection of collections) {
    const randomImage = perfumeImages[Math.floor(Math.random() * perfumeImages.length)];
    await prisma.collection.update({
      where: { id: collection.id },
      data: { imageUrl: randomImage }
    });
  }
  
  console.log('Finished updating images!');
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
