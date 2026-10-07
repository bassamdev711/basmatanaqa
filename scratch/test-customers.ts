import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  console.log('--- TESTING CUSTOMER INTEGRATION ---')

  // 1. Find a customer with an order
  const user = await prisma.user.findFirst({
    where: { orders: { some: {} } },
    include: {
      orders: true,
      loyaltyAccount: { include: { transactions: true } }
    }
  })

  if (!user) {
    console.log('No user with orders found. Creating a test user and order...')
    // Create one if none exists
    const newUser = await prisma.user.create({
      data: {
        name: 'Test Customer',
        phone: '+966500000000',
        email: 'test@example.com',
        passwordHash: 'dummy',
        isActive: true,
      }
    })

    await prisma.order.create({
      data: {
        userId: newUser.id,
        customerName: newUser.name,
        customerPhone: newUser.phone,
        governorate: 'Riyadh',
        city: 'Riyadh',
        address: 'Test Addr',
        paymentMethod: 'COD',
        totalAmount: 500,
        status: 'COMPLETED',
      }
    })

    return test() // re-run
  }

  console.log('User found:', user.id, user.name)
  console.log('Total Orders:', user.orders.length)
  console.log('Current Points:', user.loyaltyAccount?.balance || 0)

  // 2. Adjust Loyalty Points (Add)
  console.log('\n--- ADDING POINTS ---')
  const adjustResultAdd = await adjustPointsLocal(user.id, 'EARN', 100, 'Test Add Points')
  console.log('Add points result:', adjustResultAdd)

  // Verify
  let updatedAccount = await prisma.loyaltyAccount.findUnique({ where: { userId: user.id }, include: { transactions: { orderBy: { createdAt: 'desc' } } } })
  console.log('New Balance after ADD:', updatedAccount?.balance)
  console.log('Latest Transaction:', updatedAccount?.transactions[0].type, updatedAccount?.transactions[0].points, updatedAccount?.transactions[0].description)

  // 3. Adjust Loyalty Points (Deduct)
  console.log('\n--- DEDUCTING POINTS ---')
  const adjustResultDeduct = await adjustPointsLocal(user.id, 'REDEEM', 50, 'Test Deduct Points')
  console.log('Deduct points result:', adjustResultDeduct)

  // Verify
  updatedAccount = await prisma.loyaltyAccount.findUnique({ where: { userId: user.id }, include: { transactions: { orderBy: { createdAt: 'desc' } } } })
  console.log('New Balance after DEDUCT:', updatedAccount?.balance)
  console.log('Latest Transaction:', updatedAccount?.transactions[0].type, updatedAccount?.transactions[0].points, updatedAccount?.transactions[0].description)

  // 4. Try deducting more than balance (should fail)
  console.log('\n--- OVER-DEDUCTING POINTS ---')
  const overDeductResult = await adjustPointsLocal(user.id, 'REDEEM', 99999, 'Should fail')
  console.log('Over-deduct result:', overDeductResult)

  console.log('\n--- TESTS COMPLETED ---')
}

// Emulate the logic in actions.ts to test it outside Next.js context
async function adjustPointsLocal(userId: string, type: 'EARN' | 'REDEEM', points: number, description: string) {
  if (points <= 0) return { success: false, error: 'Points must be > 0' }

  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } })
  if (!account) {
    if (type === 'REDEEM') return { success: false, error: 'Not enough balance' }
    account = await prisma.loyaltyAccount.create({
      data: { userId, balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 }
    })
  }

  if (type === 'REDEEM' && account.balance < points) {
    return { success: false, error: 'Not enough balance' }
  }

  const newBalance = type === 'EARN' ? account.balance + points : account.balance - points
  const lifetimeEarned = type === 'EARN' ? account.lifetimeEarned + points : account.lifetimeEarned
  const lifetimeRedeemed = type === 'REDEEM' ? account.lifetimeRedeemed + points : account.lifetimeRedeemed

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { balance: newBalance, lifetimeEarned, lifetimeRedeemed }
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId,
        accountId: account.id,
        type,
        points,
        balanceAfter: newBalance,
        description,
        referenceKey: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        adminUserId: 'admin',
      }
    })
  ])

  return { success: true }
}

test()
