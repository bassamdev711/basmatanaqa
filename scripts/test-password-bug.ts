import { hashPassword, verifyPassword, revokeAllUserSessions } from '../lib/user-auth'
import prisma from '../lib/prisma'

async function test() {
  const userId = 'cmv2bflut0001b69yrzu0phof'
  const newPassword = 'password123456'
  
  const userBefore = await prisma.user.findUnique({ where: { id: userId } })
  console.log('User found:', userBefore?.phone, 'Hash length:', userBefore?.passwordHash.length)
  
  // Directly mimic changeCustomerPassword
  const hashedPassword = await hashPassword(newPassword)
  console.log('Generated hash using @/lib/user-auth (bcrypt):', hashedPassword, 'Length:', hashedPassword.length)
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword }
  })
  
  const userAfter = await prisma.user.findUnique({ where: { id: userId } })
  console.log('Saved Hash:', userAfter?.passwordHash, 'Length:', userAfter?.passwordHash.length)
  
  // Verify using verifyPassword (mimicking login)
  if (userAfter) {
    const isValid = await verifyPassword(newPassword, userAfter.passwordHash)
    console.log('Is valid with verifyPassword?:', isValid)
  }
}

test().catch(console.error).finally(() => prisma.$disconnect())
