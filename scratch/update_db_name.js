const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.storeSettings.updateMany({
    data: {
      storeName: 'شهرزاد',
      storeNameLatin: 'SHAHRAZAD',
    }
  });

  const homepageSettings = await prisma.homepageSettings.findUnique({ where: { id: 'singleton' } });
  if (homepageSettings) {
    let statsJson = homepageSettings.statsJson;
    statsJson = statsJson.replace(/بصمة أناقة/g, 'شهرزاد').replace(/بصمة اناقة/g, 'شهرزاد');
    
    await prisma.homepageSettings.update({
      where: { id: 'singleton' },
      data: {
        heroTitle: homepageSettings.heroTitle.replace(/بصمة أناقة/g, 'شهرزاد').replace(/بصمة اناقة/g, 'شهرزاد'),
        aboutTopTitle: homepageSettings.aboutTopTitle.replace(/بصمة أناقة/g, 'شهرزاد').replace(/بصمة اناقة/g, 'شهرزاد'),
        statsJson: statsJson
      }
    });
  }
  console.log('Database updated!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
