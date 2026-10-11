import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- تحديث إعدادات التواصل في قاعدة البيانات ---')

  const settings = await prisma.contactSettings.upsert({
    where: { id: 'singleton' },
    update: {
      phoneNumber: '+967 716 761 754',
      showPhoneNumber: true,
      whatsappNumber: '716761754',
      showWhatsappNumber: true,
      emailAddress: 'shahrazadstore.online@gmail.com',
      showEmailAddress: true,
    },
    create: {
      id: 'singleton',
      phoneNumber: '+967 716 761 754',
      showPhoneNumber: true,
      whatsappNumber: '716761754',
      showWhatsappNumber: true,
      emailAddress: 'shahrazadstore.online@gmail.com',
      showEmailAddress: true,
    }
  })

  console.log('تم تحديث البيانات بنجاح:')
  console.log('الهاتف:', settings.phoneNumber)
  console.log('الواتساب:', settings.whatsappNumber)
  console.log('الإيميل:', settings.emailAddress)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
