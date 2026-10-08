import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const newCities = [
    { name: 'المعاطيب', shippingFee: 0 },
    { name: 'الجوف', shippingFee: 0 },
    { name: 'الميهال', shippingFee: 0 },
    { name: 'المشجور', shippingFee: 0 },
    { name: 'الاكمه', shippingFee: 0 },
    { name: 'الحصير', shippingFee: 0 },
    { name: 'المشاجره', shippingFee: 0 },
    { name: 'بيدحه', shippingFee: 0 },
    { name: 'العقمه', shippingFee: 0 },
    { name: 'البرح', shippingFee: 0 },
    { name: 'أخرى', shippingFee: 0 },
  ]

  console.log('Seeding shipping cities...')

  for (const city of newCities) {
    await prisma.shippingCity.upsert({
      where: { name: city.name },
      update: {},
      create: {
        name: city.name,
        shippingFee: city.shippingFee
      }
    })
    console.log(`Added/Verified city: ${city.name}`)
  }

  console.log('✅ Done seeding cities!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
