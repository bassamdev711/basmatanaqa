import crypto from 'crypto'
import { jwtVerify, SignJWT } from 'jose'
import { getAdminJwtSecret } from '@/lib/auth'

const ISSUER = 'tif-order-upload'
const AUDIENCE = 'tif-order-upload'

export async function createOrderUploadToken(orderId: string): Promise<string> {
  return new SignJWT({ purpose: 'payment-upload', orderId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(orderId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime('20m')
    .sign(getAdminJwtSecret())
}

export async function verifyOrderUploadToken(token: string, orderId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    return payload.purpose === 'payment-upload' && payload.orderId === orderId && payload.sub === orderId
  } catch {
    return false
  }
}
