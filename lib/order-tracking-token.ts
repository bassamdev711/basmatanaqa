import crypto from 'crypto'
import { jwtVerify, SignJWT } from 'jose'
import { getAdminJwtSecret } from '@/lib/auth'

const ISSUER = 'tif-order-tracking'
const AUDIENCE = 'tif-order-tracking'

export async function createOrderTrackingToken(orderId: string): Promise<string> {
  return new SignJWT({ purpose: 'order-tracking', orderId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(orderId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime('30d')
    .sign(getAdminJwtSecret())
}

export async function verifyOrderTrackingToken(token: string, orderId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    return payload.purpose === 'order-tracking' && payload.orderId === orderId && payload.sub === orderId
  } catch {
    return false
  }
}
