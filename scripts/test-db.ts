import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing Loyalty Settings Schema...')
  try {
    const settings = await prisma.loyaltySettings.findUnique({
      where: { id: 'singleton' }
    })
    console.log('Loyalty Settings from DB:', settings)
    
    // Explicitly check maxPointsPerOrder property
    if (settings && 'maxPointsPerOrder' in settings) {
      console.log('SUCCESS: maxPointsPerOrder exists in the DB schema.')
    } else {
      console.log('FAILED: maxPointsPerOrder is missing from the DB schema.')
    }
  } catch (e) {
    console.error('Error connecting to DB:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
