import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up enterprise search infrastructure...')
  
  try {
    // 1. Enable pg_trgm extension for advanced fuzzy string matching
    console.log('Enabling pg_trgm extension...')
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
    
    // 2. Create GIN indexes for lightning-fast text search
    console.log('Creating GIN indexes on Product table...')
    
    // Index for name
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "product_name_trgm_idx" 
      ON "Product" USING GIN (name gin_trgm_ops);
    `)
    
    // Index for brand
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "product_brand_trgm_idx" 
      ON "Product" USING GIN (brand gin_trgm_ops);
    `)
    
    console.log('✅ Enterprise search indexes created successfully!')
  } catch (error) {
    console.error('Failed to setup search indexes:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
