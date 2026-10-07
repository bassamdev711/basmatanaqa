import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function exportData() {
  try {
    const models = Object.keys(prisma).filter(key => 
      !key.startsWith('_') && !key.startsWith('$') && typeof (prisma as any)[key].findMany === 'function'
    )
    
    const dbExport: any = {}
    
    for (const model of models) {
      console.log(`Exporting ${model}...`)
      dbExport[model] = await (prisma as any)[model].findMany()
    }
    
    fs.writeFileSync('database_backup.json', JSON.stringify(dbExport, null, 2))
    console.log('Export completed successfully: database_backup.json')
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
