import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const orders = [
    {
      orderNumber: 'ORD-9021',
      customerName: 'أحمد المحمد',
      customerPhone: '0501234567',
      governorate: 'إب',
      city: 'إب',
      address: 'حي الياسمين، شارع العليا',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'AWAITING_CONFIRMATION',
      status: 'NEW',
      totalAmount: 1450.00,
      paymentProofUrl: 'https://via.placeholder.com/400x600.png?text=Bank+Receipt+Sample'
    },
    {
      orderNumber: 'ORD-9020',
      customerName: 'سارة عبدالله',
      customerPhone: '0559876543',
      governorate: 'إب',
      city: 'إب',
      address: 'حي الشاطئ',
      paymentMethod: 'cod',
      paymentStatus: 'PENDING',
      status: 'PROCESSING',
      totalAmount: 890.00,
      paymentProofUrl: null
    },
    {
      orderNumber: 'ORD-9019',
      customerName: 'خالد سعيد',
      customerPhone: '0541112233',
      governorate: 'إب',
      city: 'إب',
      address: 'حي الفيصلية',
      paymentMethod: 'wallet',
      paymentStatus: 'PAID',
      status: 'SHIPPED',
      totalAmount: 2100.00,
      paymentProofUrl: 'https://via.placeholder.com/400x600.png?text=Wallet+Transfer'
    }
  ]

  for (const o of orders) {
    await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {},
      create: o
    })
  }
  
  console.log('Orders seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
