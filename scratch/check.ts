import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const collectionCount = await prisma.collection.count();
  const productCount = await prisma.product.count();
  
  console.log(`Collections count: ${collectionCount}`);
  console.log(`Products count: ${productCount}`);
  
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
  
  console.log('--- Collections ---');
  collections.forEach(c => {
    console.log(`${c.name}: ${c._count.products} products`);
  });
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
