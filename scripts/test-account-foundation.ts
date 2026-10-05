import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, normalizeEmail, normalizePhone } from '@/lib/user-auth'
import { registerSchema, loginSchema } from '@/lib/validation/user'

async function main() {
  const hash = await hashPassword('StrongPassword123!')
  assert.notEqual(hash, 'StrongPassword123!')
  assert.equal(await verifyPassword('StrongPassword123!', hash), true)
  assert.equal(await verifyPassword('wrong-password', hash), false)
  assert.equal(normalizePhone('+967 777-123-456'), '+967777123456')
  assert.equal(normalizeEmail(' TEST@EXAMPLE.COM '), 'test@example.com')
  assert.equal(registerSchema.safeParse({ name: 'عميل', phone: '+967777123456', password: 'StrongPassword123!' }).success, true)
  assert.equal(loginSchema.safeParse({ phone: '+967777123456', password: '' }).success, false)
  console.log('account-foundation smoke tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
