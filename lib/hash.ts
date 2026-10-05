import crypto from 'crypto'

/**
 * يولد هاش مشفر بكلمة المرور باستخدام خوارزمية scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

/**
 * يتحقق مما إذا كانت كلمة المرور تطابق الهاش المحفوظ
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!hash || !hash.includes(':')) return false
  
  const [salt, key] = hash.split(':')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  
  // Use timingSafeEqual to prevent timing attacks
  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKeyBuffer = Buffer.from(derivedKey, 'hex')
  
  if (keyBuffer.length !== derivedKeyBuffer.length) return false
  return crypto.timingSafeEqual(keyBuffer, derivedKeyBuffer)
}
