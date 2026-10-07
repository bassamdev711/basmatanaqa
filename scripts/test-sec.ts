import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function runTests() {
  const results: any = {}

  try {
    // Test 2: Concurrent Cancellation Race Condition
    const product = await prisma.product.create({
      data: {
        name: 'Test Prod ' + crypto.randomUUID(),
        slug: 'test-prod-' + crypto.randomUUID(),
        price: 10,
        stock: 1,
        hasSizes: false
      }
    })
    const orderUser = await prisma.user.create({
      data: {
        name: 'Test Order User',
        phone: '987654321' + Math.floor(Math.random()*1000),
        passwordHash: 'dummy'
      }
    })
    const order = await prisma.order.create({
      data: {
        userId: orderUser.id,
        customerName: 'Test',
        customerPhone: '123',
        governorate: 'Gov',
        city: 'City',
        address: 'Addr',
        paymentMethod: 'cod',
        totalAmount: 10,
        status: 'NEW',
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            price: 10
          }]
        }
      }
    })
    
    // We mock the exact new transaction logic from updateOrderStatus
    const runCancel = async () => {
      try {
        let previousStatus = ''
        await prisma.$transaction(async (tx) => {
          const orderInTx = await tx.order.findUnique({
            where: { id: order.id },
            include: { items: true }
          })
          if (!orderInTx) throw new Error('ORDER_NOT_FOUND')
          previousStatus = orderInTx.status
          if (previousStatus === 'CANCELLED' || previousStatus === 'REFUNDED') {
            throw new Error('INVALID_TRANSITION')
          }
          
          const updateRes = await tx.order.updateMany({
            where: { id: order.id, status: previousStatus },
            data: { status: 'CANCELLED' }
          })
          
          if (updateRes.count !== 1) {
            throw new Error('CONCURRENT_TRANSITION_FAILED')
          }
          
          for (const item of orderInTx.items) {
            if (item.productId) {
              await tx.product.updateMany({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
              })
            }
          }
        })
        return 'SUCCESS'
      } catch (e: any) {
        return e.message
      }
    }
    
    // Test with 50 concurrent requests
    const promises = []
    for(let i=0; i<50; i++) promises.push(runCancel())
    const runs = await Promise.all(promises)
    
    const finalProduct = await prisma.product.findUnique({ where: { id: product.id } })
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
    
    const successCount = runs.filter(r => r === 'SUCCESS').length
    const concurrentFailures = runs.filter(r => r === 'CONCURRENT_TRANSITION_FAILED').length
    const otherErrors = runs.filter(r => r !== 'SUCCESS' && r !== 'CONCURRENT_TRANSITION_FAILED')

    results.cancelRace = {
      test: 'Concurrent Cancellation (50 requests)',
      successCount,
      concurrentFailures,
      otherErrors,
      finalStock: finalProduct?.stock,
      finalOrderStatus: finalOrder?.status,
      passed: finalProduct?.stock === 2 && successCount === 1 && finalOrder?.status === 'CANCELLED'
    }

    // Clean up
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.user.delete({ where: { id: orderUser.id } })

  } catch (err: any) {
    console.error(err)
  }

  console.log(JSON.stringify(results, null, 2))
}

runTests()
